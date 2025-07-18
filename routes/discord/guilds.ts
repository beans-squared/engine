import express from 'express'
import { database } from '../../database.js'
import { logger } from '../../logger.js'

export const guilds = express.Router()

guilds
	.route('/discord/guilds')
	.post(async (request, response) => {
		const created = await database.discordGuild
			.create({
				data: {
					id: request.body.id,
					name: request.body.name,
				},
			})
			.catch((error) => logger.error(`Error while attempting settings intialization for discord guild\n${error}`))

		if (created) {
			logger.info(`Intitalized settings for discord guild ${created.name} (${created.id})`)
			return response.status(201).end()
		} else {
			return response.status(500).end()
		}
	})
	.delete(async (request, response) => {
		const deleted = await database.discordGuild
			.delete({
				where: {
					id: request.body.id,
				},
				include: {
					DiscordChannel: true,
				},
			})
			.catch((error) => logger.error(`Error while attempting to delete discord guild\n${error}`))

		if (deleted) {
			logger.info(`Deleted discord guild ${deleted.name} (${deleted.id}) and all associated channels`)
			return response.status(200).end()
		} else {
			return response.status(404).end()
		}
	})

guilds.route('/projects/guild/:guildId').get(async (request, response) => {
	// Returns all tracked projects for the provided Discord guild
	const results = await database.discordChannelProject.findMany({
		where: {
			discordChannel: {
				discordGuildId: request.params.guildId,
			},
		},
		include: {
			project: true,
			discordChannel: {
				include: {
					discordGuild: true,
				},
			},
		},
	})
	return response.status(200).json(results)
})
