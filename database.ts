import { PrismaClient } from '@prisma/client'
import { curseforge } from './external_api/curseforge.js'
import { modrinth } from './external_api/modrinth.js'
import { logger } from './logger.js'

export const database = new PrismaClient()

export const databaseUtils = {
	guilds: {
		findOrCreate: async (id: string) => {
			const guild = await database.discordGuild.findUnique({
				
			})
		}
	},
	projects: {
		findOrCreate: async (id: string, platform: 'CurseForge' | 'Modrinth') => {
			const project = await database.project.findUnique({
				where: {
					id_platform: {
						id: id,
						platform: platform,
					},
				},
			})

			if (!project) {
				// project was not found in the database, we must grab the info from the platform and create a new entry
				switch (platform) {
					case 'CurseForge': {
						const response = await curseforge.endpoints.getMod(id)

						if (response) {
							const latestVersions = response.data.latestFiles.map((file) => ({
								id: `${file.id}`,
								datePublished: file.fileDate,
							}))

							return await database.project
								.create({
									data: {
										id: `${response.data.id}`,
										platform: 'CurseForge',
										name: response.data.name,
										gameId: `${response.data.gameId}`,
										logoUrl: response.data.logo.url,
										dateUpdated: response.data.dateReleased,
										versions: {
											create: [...latestVersions],
										},
									},
								})
								.catch((error) => logger.error(error))
						} else {
							throw new Error('Failed to get project information from CurseForge')
						}
					}
					case 'Modrinth': {
						const response = await modrinth.endpoints.getProject(id)
						break
					}
				}
			} else {
				// project exists in database, simply return the project information
				return project
			}
		},
	},
}
