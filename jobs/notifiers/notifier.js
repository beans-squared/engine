import { database } from '../../database'

export const notify = async (projects = []) => {
	for (const project of projects) {
		const destinations = database.projectDestination.findMany({
			where: {
				projectId: project.projectId,
				projectPlatform: project.projectPlatform,
			},
		})

		for (const destination of destinations) {
			switch (destination.type) {
				case 'DISCORD_CHANNEL':
				case 'DISCORD_USER':
				case 'EMAIL':
				case 'WEBHOOK':
			}
		}
	}
}
