import express from 'express'
import meta from './package.json' assert { type: 'json' }
import { logger } from './logger.js'
import 'dotenv/config.js'

import heartbeat from './jobs/heartbeat.js'

import { channels } from './routes/discord/channels.js'
import { guilds } from './routes/discord/guilds.js'
import { projects } from './routes/projects.js'

const app = express()
app.use(express.json())

// Routes
app.use(channels)
app.use(guilds)
app.use(projects)

app.use('/', (request, response) => {
	return response.send({
		about: 'Welcome Traveler!',
		docs: 'https://modrunner.net/docs',
		name: 'modrunner-api',
		version: meta.version,
	})
})

// Jobs
heartbeat.start()

// curseforge.start()

// Start server
app.listen(process.env.CONFIG_SERVER_PORT, () => {
	logger.info(`Server listening on port ${process.env.CONFIG_SERVER_PORT}`)
})
