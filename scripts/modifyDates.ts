import { database } from '../database.js'

await database.project.updateMany({
	data: {
		dateUpdated: new Date('2000-01-01'),
	},
})
