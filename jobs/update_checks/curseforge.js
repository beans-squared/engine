import { database } from '../../database'
import { curseforge } from '../../external_api/curseforge'
import { notify } from '../notifiers/notifier'
import logger from '../logger'
import 'dotenv/config'

const MAX_BATCH_CALL_SIZE = 1000

export const curseforgeUpdateCheck = async () => {
	logger.debug('Checking CurseForge projects for updates...')

	const projects = await database.project.findMany({
		where: {
			platform: 'CurseForge',
		},
		include: {
			versions: true,
		},
	})

	if (projects.length <= 0) return logger.debug('Not tracking any CurseForge projects, cancelling update check')

	// Get a list of all game IDs in the database
	const gameIds = []
	for (const project of projects) {
		if (!gameIds.includes(project.gameId)) {
			gameIds.push(project.gameId)
		}
	}

	// Sort our projects into lists of IDs with the same gameId
	const idsByGameId = []
	for (const gameId of gameIds) {
		const filtered = projects.filter((item) => item.gameId === gameId)
		ids.push(filtered.map((item) => item.id))
	}

	// Call CurseForge using batching for each gameId
	const responseData = []
	for (const idList of idsByGameId) {
		// Split into batches of MAX_BATCH_CALL_SIZE if needed
		let batches = []
		if (idList.length > MAX_BATCH_CALL_SIZE) {
			for (let i = 0; i < Math.ceil(idList.length / MAX_BATCH_CALL_SIZE); i++) {
				batches.push(idList.slice(0, MAX_BATCH_CALL_SIZE))
				idList.splice(0, MAX_BATCH_CALL_SIZE)
			}
		} else {
			batches.push(idList)
		}

		// Grab the data from CurseForge
		for (const batch of batches) {
			const response = await curseforge.endpoints.getMods({ modIds: batch })
			responseData.push(response.data)
		}
	}

	const notifierData = []
	for (const project of projects) {
		const data = responseData.find((item) => item.id.toString() === project.id)

		// Check if the project's data is in the response data
		if (!data) {
			logger.debug(`Failed to locate response data for project ${project.name} (${project.id}) in the response data`)
			continue
		}

		// Check if the project's dateReleased field has changed
		if (data.dateReleased.getTime() !== project.updated.getTime()) {
			// Check if the project has files at all
			if (data.latestFiles.length > 0) {
				// Check the project's versions to see if the latest file is already there
				if (!project.versions.includes(data.latestFiles[0].id)) {
					// TODO success! project has an update -> send the data off to the notification handler

					const changelog = await curseforge.endpoints.getModFileChangelog({ modId: project.id, fileId: data.latestFiles[0].id })

					notifierData.push({
						projectId: project.id,
						projectPlatform: 'CurseForge',
						projectName: project.name,
						projectLogo: data.logo.url,
						versionId: data.latestFiles[0].id,
						versionName: data.latestFiles[0].displayName,
						versionNumber: data.latestFiles[0].fileName,
						versionChangelog: formatHtmlChangelog(changelog),
					})

					notify(notifierData)

					database.project.update({
						where: {
							id: project.id,
							platform: 'CurseForge',
						},
						data: {
							name: data.name,
							updated: data.dateReleased,
							versions: {
								create: {
									versionId: data.latestFiles[0].id,
									date: data.latestFiles[0].fileDate,
								},
							},
						},
					})
				}
			} else {
				database.project.update({
					where: {
						id: project.id,
						platform: 'CurseForge',
					},
					data: {
						name: data.name,
						updated: data.dateReleased,
					},
				})
			}
		}
	}
}

function formatHtmlChangelog(changelog) {
	return changelog
		.replace(/<br>/g, '\n') // Fix line breaks
		.replace(/<.*?>/g, '') // Remove HTML tags
		.replace(/&\w*?;/g, '') // Remove HTMl special characters
}
