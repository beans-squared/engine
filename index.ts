import express from 'express'
import meta from './package.json' assert { type: 'json' }
import { logger } from './logger.js'
import 'dotenv/config.js'

import heartbeat from './jobs/heartbeat.js'
import curseforge from './jobs/update_checks/curseforge.js'

import { discordChannelRoute } from './routes/discordChannel.js'
import { discordGuildRoute } from './routes/discordGuild.js'
import { project } from './routes/project.js'

const app = express()
app.use(express.json())

// Routes
app.use(discordChannelRoute)
app.use(discordGuildRoute)
app.use(project)

app.use('/', (request, response) => {
	return response.send({
		about: 'Welcome Traveler!',
		docs: '',
		name: 'modrunner-api',
		version: meta.version,
	})
})

// Jobs
heartbeat.start()

curseforge.start()

// Start server
app.listen(process.env.CONFIG_SERVER_PORT, () => {
	logger.info(`Server listening on port ${process.env.CONFIG_SERVER_PORT}`)
})
