import express from 'express'
import { database } from './database.js'
import { logger } from './logger.js'

export const router = express.Router()

router
	.route('/discord_guild')
	.post(async (request, response) => {
		try {
			const created = await database.discordGuild.create({
				data: {
					id: request.body.id,
					name: request.body.name,
				},
			})

			logger.info(`Intitalized settings for discord guild ${created.name} (${created.id})`)

			return response.status(201).end()
		} catch (error) {
			logger.error('Error while attempting settings intialization for discord guild', error)
		}

		return response.status(500).end()
	})
	.delete(async (request, response) => {
		try {
			const deleted = await database.discordGuild.delete({
				where: {
					id: request.body.id,
				},
				include: {
					DiscordChannel: true,
				},
			})

			logger.info(`Deleted discord guild ${deleted.name} (${deleted.id}) and all associated channels`)

			return response.status(201).end()
		} catch (error) {
			logger.error('Error while attempting to delete discord guild', error)
		}

		return response.status(500).end()
	})

router.route('/discord_channel').delete(async (request, response) => {
	try {
		const deleted = await database.discordChannel.delete({
			where: {
				id: request.body.id,
			},
			include: {
				projects: true,
			},
		})

		logger.debug(`Deleted discord channel ${deleted.name} (${deleted.id}) and all associated tracked projects`)

		return response.status(201).end()
	} catch (error) {
		logger.error('Error while attempting to delete discord channel', error)
	}

	return response.status(500).end()
})
