import express from 'express'
import { database } from '../../database.js'
import { logger } from '../../logger.js'

export const channels = express.Router()

channels.route('/discord/channels').delete(async (request, response) => {
	const deleted = await database.discordChannel
		.delete({
			where: {
				id: request.body.id,
			},
			include: {
				projects: true,
			},
		})
		.catch((error) => logger.error(`Error while attempting to delete discord channel:\n${error}`))

	if (deleted) {
		logger.debug(`Deleted discord channel ${deleted.name} (${deleted.id}) and all associated tracked projects`)
		return response.status(201).end()
	} else {
		return response.status(404).end()
	}
})
