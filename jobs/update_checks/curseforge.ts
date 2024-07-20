import { database } from '../../database.js'
import { curseforge } from '../../external_api/curseforge.js'
import { notify } from '../notifiers/notifier.js'
import { logger } from '../../logger.js'
import { CronJob } from 'cron'
import 'dotenv/config'

const MAX_BATCH_CALL_SIZE = 1000

export default new CronJob('0 * * * * *', async () => {
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
	const gameIds: string[] = []
	for (const project of projects) {
		if (!gameIds.includes(project.gameId)) {
			gameIds.push(project.gameId)
		}
	}

	// Sort our projects into lists of IDs with the same gameId
	const idsByGameId = []
	for (const gameId of gameIds) {
		const filtered = projects.filter((item) => item.gameId === gameId)
		idsByGameId.push(filtered.map((item) => item.id))
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
			const response = await curseforge.endpoints.getMods(batch)
			if (response) {
				for (const mod of response.data) {
					responseData.push(mod)
				}
			}
		}
	}

	const notifierData = []
	for (const project of projects) {
		const data = responseData.find((item) => item.id.toString() === project.id)

		// Check if the project's data is in the response data
		if (!data) {
			logger.debug(`Failed to locate project ${project.name} (${project.id}) in the response data`)
			continue
		}

		// Check if the project's dateReleased field has changed
		if (new Date(data.dateReleased).getTime() !== project.dateUpdated.getTime()) {
			// Check if the project has files at all
			if (data.latestFiles.length > 0) {
				// Check the project's versions to see if the latest file is already there
				const latestFile = data.latestFiles[data.latestFiles.length - 1]
				if (!project.versions.find((item) => item.id === latestFile.id.toString())) {
					// success! project has an update

					const changelog = await curseforge.endpoints.getModFileChangelog(project.id, latestFile.id.toString())
					let changelogContent = ''
					if (changelog) changelogContent = changelog.data

					// Add new version data to the project in the database
					const databaseProject = await database.project.update({
						where: {
							id_platform: {
								id: project.id,
								platform: project.platform,
							},
						},
						data: {
							name: data.name,
							dateUpdated: data.dateReleased,
							versions: {
								create: {
									id: `${latestFile.id}`,
									datePublished: latestFile.fileDate,
								},
							},
						},
						include: {
							versions: true,
						},
					})

					// Add to the notifier queue
					notifierData.push({
						project: {
							id: project.id,
							platform: project.platform,
						},
						version: {
							id: `${latestFile.id}`,
							name: latestFile.displayName,
							number: latestFile.fileName,
							type: releaseTypeToString(latestFile.releaseType),
							date: latestFile.fileDate,
							changelog: formatHtmlChangelog(changelogContent),
						},
					})
				}
			} else {
				await database.project.update({
					where: {
						id_platform: {
							id: project.id,
							platform: project.platform,
						},
					},
					data: {
						name: data.name,
						dateUpdated: data.dateReleased,
					},
				})
			}
		}
	}
	// Send all updated project data off to the notifier
	notify(notifierData)
})

function formatHtmlChangelog(changelog: string) {
	return changelog
		.replace(/<br>/g, '\n') // Fix line breaks
		.replace(/<.*?>/g, '') // Remove HTML tags
		.replace(/&\w*?;/g, '') // Remove HTMl special characters
}

function releaseTypeToString(releaseType: number) {
	switch (releaseType) {
		case 1:
			return 'release'
		case 2:
			return 'beta'
		case 3:
			return 'alpha'
		default:
			return 'unknownReleaseType'
	}
}
