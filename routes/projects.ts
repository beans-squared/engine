import express, { Request, Response } from 'express'
import { database } from '../database.js'
import * as schema from '../database/schema.js'
import { logger } from '../logger.js'
import { and, eq } from 'drizzle-orm'
import { curseforge } from '../external_api/curseforge.js'
import { modrinth } from '../external_api/modrinth.js'

export const projects = express.Router()

projects
	.route('/projects')
	.get(getProjectCount)
	.post(trackProject)
	.delete(async (request, response) => {
		// Removes a tracking destination
		return response.send('Not implemented')
	})

/** Returns the number of projects currently being tracked by the engine */
async function getProjectCount(request: Request, response: Response) {
	const count = await database.$count(schema.project)
	return response.status(200).json({ count: count })
}

async function trackProject(request: Request, response: Response) {
	const requestBody = request.body as {
		project: {
			id: string
			platform: 'CurseForge' | 'FeedTheBeast' | 'GitHub' | 'Mod.io' | 'Modrinth' | 'NexusMods'
		}
		discord?: {
			channel?: {
				id: string
				name: string
				guild: {
					id: string
					name: string
				}
			}
		}
	}

	// Verify all the required body parameters are present and correct
	if (!requestBody.project) {
		return response.status(400).json({
			error: `Missing required body parameter 'project'`,
		})
	}

	if (!requestBody.project.id) {
		return response.status(400).json({
			error: `Missing required body parameter 'project.id'`,
		})
	}

	if (typeof requestBody.project.id !== 'string') {
		return response.status(400).json({
			error: `Expected value of body parameter 'project.id' to be a string, instead got a ${typeof requestBody.project.id}`,
		})
	}

	if (!requestBody.project.platform) {
		return response.status(400).json({
			error: `Missing required body parameter 'project.platform'`,
		})
	}

	if (typeof requestBody.project.platform !== 'string') {
		return response.status(400).json({
			error: `Expected value of body parameter 'project.platform' to be a string, instead got a ${typeof requestBody.project.platform}`,
		})
	}

	if (!['CurseForge', 'FeedTheBeast', 'GitHub', 'Mod.io', 'Modrinth', 'NexusMods'].includes(requestBody.project.platform)) {
		return response.status(400).json({
			error: `Body parameter 'project.platform' must be one of these valid platforms: 'CurseForge', 'FeedTheBeast', 'GitHub', 'Mod.io', 'Modrinth', 'NexusMods'. Instead recieved '${requestBody.project.platform}'`,
		})
	}

	// Grab the project information from the database
	let project = await database
		.select()
		.from(schema.project)
		.where(and(eq(schema.project.id, requestBody.project.id), eq(schema.project.platform, requestBody.project.platform)))

	if (project.length === 0) {
		// Project was not found in the database, we must grab the info from the platform and create a new database entry
		switch (requestBody.project.platform) {
			case 'CurseForge': {
				const fetchedProject = await curseforge.endpoints.getMod(requestBody.project.id)

				if (fetchedProject === null) return response.status(404).json({ error: `No project with ID ${requestBody.project.id} exists on CurseForge.` })
				if (fetchedProject === undefined) return response.status(500)

				if (fetchedProject) {
					const latestVersions = fetchedProject.data.latestFiles.map((file) => ({
						id: `${file.id}`,
						projectId: `${fetchedProject.data.id}`,
						projectPlatform: 'CurseForge',
						datePublished: new Date(file.fileDate),
					}))

					project = await database
						.insert(schema.project)
						.values({
							id: `${fetchedProject.data.id}`,
							platform: 'CurseForge',
							name: fetchedProject.data.name,
							gameId: `${fetchedProject.data.gameId}`,
							logoUrl: fetchedProject.data.logo.url,
							dateUpdated: new Date(fetchedProject.data.dateReleased),
						})
						.returning()

					await database.insert(schema.projectVersion).values([...latestVersions])
				} else {
					logger.error(`Failed to fetch project information from CurseForge with project ID ${requestBody.project.id}`)
					return response.status(500).end()
				}
				break
			}
			case 'Modrinth': {
				const fetchedProject = await modrinth.endpoints.getProject(requestBody.project.id)
				const fetchedVersions = await modrinth.endpoints.listProjectVersions(requestBody.project.id)

				if (fetchedProject && fetchedVersions) {
					const mrproject = fetchedProject as {
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
						projectId: `${mrproject.id}`,
						projectPlatform: 'Modrinth',
						datePublished: new Date(version.date_published),
					}))

					project = await database
						.insert(schema.project)
						.values({
							id: `${mrproject.id}`,
							platform: 'Modrinth',
							name: mrproject.title,
							gameId: '',
							logoUrl: mrproject.icon_url,
							dateUpdated: new Date(mrproject.updated),
						})
						.returning()

					await database.insert(schema.projectVersion).values([...latestVersions])
				} else {
					throw new Error('Failed to get project information from Modrith')
				}
				break
			}
			default:
				return response.status(400).json({ error: `Platform '${requestBody.project.platform}' is not currently supported by Modrunner.` })
		}
	}

	if (requestBody.discord) {
		if (requestBody.discord.channel) {
			// Tracking in a guild channel
			const guild = await database.select().from(schema.discordGuild).where(eq(schema.discordGuild.id, requestBody.discord.channel.guild.id))
			const currentTrackedProjectCount = await database.$count(
				schema.trackedProject,
				eq(schema.trackedProject.discordChannelId, requestBody.discord.channel.id)
			)

			return response.status(200).send('End of func')

			if (guild) {
				let count = 0
				for (const channel of guild.channels) {
					count = count + channel.trackedProjects.length
				}

				if (count >= guild.maxProjects) {
					return response.status(400).json({
						error: 'Maximum number of tracked projects reached for this guild',
					})
				}

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
			return response.status(400).json({
				error: `Missing required body parameters 'discord.channel' or 'discord.user'`,
			})
		}

		return response.status(201).end()
	}
}
