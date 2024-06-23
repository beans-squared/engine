import express from 'express'
import { database } from '../database.js'
import { logger } from '../logger.js'

export const misc = express.Router()

misc.route('/stats').get(async (request, response) => {
	try {
		const numProjects = await database.project.count()

		if (process.env.BETTERSTACK_STATUS_PAGE_ID && process.env.BETTERSTACK_RESOURCE_ID) {
			const uptimeData = await fetch(
				`https://uptime.betterstack.com/api/v2/status-pages/${process.env.BETTERSTACK_STATUS_PAGE_ID}/resources/${process.env.BETTERSTACK_RESOURCE_ID}`,
				{
					headers: {
						authorization: `Bearer ${process.env.BETTERSTACK_API_KEY}`,
					},
				}
			)
				.then((res) => res.json())
				.catch((error) => logger.error(error));
	
			return response.status(200).json({
				servers: request.app.locals.client.guilds.cache.size,
				projects: numProjects,
				uptime: uptimeData.data.attributes.availability,
			});
		} else {
			return response.status(200).json({
				servers: request.app.locals.client.guilds.cache.size,
				projects: numProjects,
				uptime: 0.0,
			});
		}
	}
})
