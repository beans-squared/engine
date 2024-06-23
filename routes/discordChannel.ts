import express from 'express'
import { database } from '../database.js'
import { logger } from '../logger.js'

export const discordChannelRoute = express.Router()

discordChannelRoute.route('/discord_channel').delete(async (request, response) => {
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
