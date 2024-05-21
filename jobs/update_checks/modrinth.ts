import { database } from '../../database.js'
import { modrinth } from '../../external_api/modrinth.js'
import { notify } from '../notifiers/notifier.js'
import { logger } from '../../logger.js'
import 'dotenv/config'

const MAX_BATCH_CALL_SIZE = 1900

export const modrinthUpdateCheck = async () => {
	logger.debug('Checking Modrinth projects for updates...')

	const projects = await database.project.findMany({
		where: {
			platform: 'Modrinth',
		},
		include: {
			versions: true,
		},
	})

	if (projects.length <= 0) return logger.debug('Not tracking any Modrinth projects, cancelling update check')

	const ids = projects.map((project) => project.id)

	// Split into batches of MAX_BATCH_CALL_SIZE if needed
	let batches = []
	if (ids.length > MAX_BATCH_CALL_SIZE) {
		for (let i = 0; i < Math.ceil(ids.length / MAX_BATCH_CALL_SIZE); i++) {
			batches.push(ids.slice(0, MAX_BATCH_CALL_SIZE))
			ids.splice(0, MAX_BATCH_CALL_SIZE)
		}
	} else {
		batches.push(ids)
	}

	// Grab the data from Modrinth
	const responseData = []
	for (const batch of batches) {
		const response = await modrinth.endpoints.getProjects({ projectIds: batch })
		responseData.push(response.data)
	}

	const notifierData = []
	for (const project of projects) {
		const data = responseData.find((item) => item.id.toString() === project.id)

		if (!data) {
			logger.debug(`Failed to locate response data for project ${project.name} (${project.id}) in the response data`)
			continue
		}

		// Check if the project's updated field has changed
		if (data.updated.getTime() !== project.updated.getTime()) {
			// Check if the project has files at all
			if (data.versions.length > 0) {
				// Check the project's versions to see if the latest file is already there
				if (!project.versions.includes(data.versions[0].id)) {
					// TODO success! project has an update -> send the data off to the notification handler

					const versionData = await modrinth.endpoints.listProjectVersions({ projectId: project.id })

					notifierData.push({
						projectId: project.id,
						projectPlatform: 'Modrinth',
						projectName: project.name,
						projectLogo: data.icon_url,
						versionId: versionData[0].id,
						versionName: versionData[0].name,
						versionNumber: versionData[0].version_number,
						versionChangelog: versionData[0].changelog,
					})

					notify(notifierData)

					database.project.update({
						where: {
							id: project.id,
							platform: 'Modrinth',
						},
						data: {
							name: data.title,
							updated: data.updated,
							versions: {
								create: {
									versionId: data.versions[0].id,
									date: data.versions[0].date,
								},
							},
						},
					})
				}
			} else {
				database.project.update({
					where: {
						id: project.id,
						platform: 'Modrinth',
					},
					data: {
						name: data.title,
						updated: data.updated,
					},
				})
			}
		}
	}
}
