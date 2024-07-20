import express from 'express'
import { database, databaseUtils } from '../database.js'
import { logger } from '../logger.js'
import { curseforge } from '../external_api/curseforge.js'
import { modrinth } from '../external_api/modrinth.js'

export const project = express.Router()

interface TrackProjectBody {
	project: {
		id: string
		platform: 'CurseForge' | 'Modrinth'
	}
	discord?: {
		channel: {
			id: string
			name?: string
			guild?: {
				id: string
				name: string
			}
		}
	}
	webhook?: {}
}

project.route('/project').post(async (request, response) => {
	const requestBody = request.body as TrackProjectBody

	const project = await databaseUtils.projects.findOrCreate(requestBody.project.id, requestBody.project.platform)

	// TODO check max tracked projects in guild before tracking

	if (requestBody.discord) {
		if (requestBody.discord.channel.guild) {
			// tracking in a guild channel
			const guild = await database.discordGuild.findUnique({
				where: {
					id: requestBody.discord.channel.guild.id,
				},
				include: {
					channels: {
						where: {
							id: requestBody.discord.channel.id,
						},
						include: {
							trackedProjects: {
								where: {
									projectId: requestBody.project.id,
									projectPlatform: requestBody.project.platform,
								},
							},
						},
					},
				},
			})

			if (guild) {
				try {
					await database.discordGuild.update({
						where: {
							id: requestBody.discord.channel.guild.id,
						},
						data: {
							name: requestBody.discord.channel.guild.name,
							channels: {
								upsert: {
									where: {
										id: requestBody.discord.channel.id,
									},
									create: {
										id: requestBody.discord.channel.id,
										name: requestBody.discord.channel.name,
										trackedProjects: {
											create: {
												projectId: requestBody.project.id,
												projectPlatform: requestBody.project.platform,
											},
										},
									},
									update: {
										name: requestBody.discord.channel.name,
										trackedProjects: {
											upsert: {
												where: {
													projectId_projectPlatform_discordChannelId: {
														projectId: requestBody.project.id,
														projectPlatform: requestBody.project.platform,
														discordChannelId: requestBody.discord.channel.id,
													},
												},
												create: {
													projectId: requestBody.project.id,
													projectPlatform: requestBody.project.platform,
												},
												update: {},
											},
										},
									},
								},
							},
						},
					})
					return response.status(200).end()
				} catch (error) {
					logger.error(error)
					return response.status(500).end()
				}
			} else {
				try {
					await database.discordGuild.create({
						data: {
							id: requestBody.discord.channel.guild.id,
							name: requestBody.discord.channel.guild.name,
							channels: {
								create: {
									id: requestBody.discord.channel.id,
									name: requestBody.discord.channel.name,
									trackedProjects: {
										create: {
											projectId: requestBody.project.id,
											projectPlatform: requestBody.project.platform,
										},
									},
								},
							},
						},
					})
					return response.status(200).end()
				} catch (error) {
					logger.error(error)
					return response.status(500).end()
				}
			}
		} else {
			// tracking in a DM channel
		}
	} else if (requestBody.webhook) {
		return response.status(418).end()
	}
})

project.route('/project_count').get(async (request, response) => {
	const count = await database.project.count().catch((error) => logger.error(`Error while counting projects\n${error}`))
	if (typeof count === 'number') {
		return response.status(200).json({ count: count })
	} else {
		return response.status(500).end()
	}
})
