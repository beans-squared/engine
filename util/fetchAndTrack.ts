import { logger } from '../logger.js'
import { database } from '../database.js'
import { curseforge } from '../external_api/curseforge.js'
import { modrinth } from '../external_api/modrinth.js'

export async function fetchAndTrack(id: string, platform: 'CurseForge' | 'Modrinth') {
	switch (platform) {
		case 'CurseForge': {
			const fetchedProject = await curseforge.endpoints.getMod(id)

			if (fetchedProject) {
				const latestVersions = fetchedProject.data.latestFiles.map((file) => ({
					id: `${file.id}`,
					datePublished: file.fileDate,
				}))

				return await database.project
					.create({
						data: {
							id: `${fetchedProject.data.id}`,
							platform: 'CurseForge',
							name: fetchedProject.data.name,
							gameId: `${fetchedProject.data.gameId}`,
							logoUrl: fetchedProject.data.logo.url,
							dateUpdated: fetchedProject.data.dateReleased,
							versions: {
								create: [...latestVersions],
							},
						},
					})
					.catch((error) => {
						logger.error(error)
					})
			} else {
				throw new Error('Failed to get project information from CurseForge')
			}
		}
		case 'Modrinth': {
			const fetchedProject = await modrinth.endpoints.getProject(id)
			const fetchedVersions = await modrinth.endpoints.listProjectVersions(id)

			if (fetchedProject && fetchedVersions) {
				const project = fetchedProject as {
					title: string
					id: string
					icon_url: string
					updated: string
				}
				const versions = fetchedVersions as [
					{
						id: string
						date_published: string
					}
				]
				const latestVersions = versions.map((version) => ({
					id: `${version.id}`,
					datePublished: version.date_published,
				}))

				return await database.project
					.create({
						data: {
							id: `${project.id}`,
							platform: 'Modrinth',
							name: project.title,
							gameId: '',
							logoUrl: project.icon_url,
							dateUpdated: project.updated,
							versions: {
								create: [...latestVersions],
							},
						},
					})
					.catch((error) => {
						logger.error(error)
					})
			} else {
				throw new Error('Failed to get project information from Modrith')
			}
		}
		default:
			throw new Error(`Platform '${platform}' does not exist or support has not been added yet`)
	}
}
