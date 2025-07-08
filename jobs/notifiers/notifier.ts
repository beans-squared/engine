import { database } from '../../database.js'
import { logger } from '../../logger.js'

export const notify = async (notifierProjects: NotifierProject[] = []) => {
	for (const notifierProject of notifierProjects) {
		const destinations = []

		// Discord Channels
		const discordChannelProjects = await database.discordChannelProject.findMany({
			where: {
				projectId: notifierProject.project.id,
				projectPlatform: notifierProject.project.platform,
			},
			include: {
				discordChannel: true,
			},
		})

		for (const discordChannelProject of discordChannelProjects) {
			const notification = await database.notification.create({})
			await database.discordChannelProject.update({
				data: {
					notifications: {
						connect: { id: notification.id },
					},
				},
				where: {
					projectId_projectPlatform_discordChannelId: {
						projectId: null,
						projectPlatform: null,
						discordChannelId: discordChannelProject.
					},
				},
			})

			destinations.push({
				channelId: discordChannelProject.discordChannelId,
				guildId: discordChannelProject.discordChannel.discordGuildId,
				notificationId: notification.id,
			})
		}

		// Discord Users
		const discordUserProjects = await database.discordUserProject.findMany({
			where: {
				projectId: notifierProject.project.id,
				projectPlatform: notifierProject.project.platform,
			},
		})

		for (const discordUserProject of discordUserProjects) {
			const notification = await database.notification.create({})
			await database.discordUserProject.update({
				data: {
					notifications: {
						connect: { id: notification.id },
					},
				},
				where: {
					id: discordUserProject.id,
				},
			})

			destinations.push({
				userId: discordUserProject.discordUserId,
				notificationId: notification.id,
			})
		}

		// // Webhooks
		// const webhookProjects = await database.webhookProject.findMany({
		// 	where: {
		// 		projectId: notifierProject.project.id,
		// 		projectPlatform: notifierProject.project.platform,
		// 	},
		// })

		const project = await database.project.findUnique({
			where: {
				id_platform: {
					id: notifierProject.project.id,
					platform: notifierProject.project.platform,
				},
			},
		})

		if (!project) {
			logger.warn(`Could not find ${notifierProject.project.platform} project ${notifierProject.project.id} during the notification process`)
			continue
		}

		const response = await fetch(`${process.env.CONFIG_DISCORD_BOT_API_BASE_URL}/notify`, {
			method: 'POST',
			body: JSON.stringify({
				project: {
					...notifierProject.project,
					platform: project.platform,
					logoUrl: project.logoUrl,
				},
				version: {
					...notifierProject.version,
				},
				destinations: destinations,
			}),
		})

		if (response.status !== 200) {
			const notifications = await response.json()

			if (notifications instanceof Array) {
				for (const notification of notifications) {
					await database.notification.update({
						data: {
							status: notification.status,
						},
						where: {
							id: notification.id,
						},
					})
				}
			} else {
				logger.error('Failed to parse json response from notification request')
			}
		} else {
			logger.error(`Discord notification request failed with code ${response.status} ${response.statusText}`)
		}
	}
}

interface NotifierProject {
	project: {
		id: string
		platform: string
	}
	version: {
		id: string
		name: string
		number: string
		type: string
		date: string
		changelog: string
	}
}

interface NotifyRequestResponse {
	notifications: [
		{
			id: number
			status: number
		}
	]
}
