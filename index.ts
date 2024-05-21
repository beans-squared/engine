import express from 'express'
import meta from './package.json' assert { type: 'json' }
import heartbeat from './jobs/heartbeat.js'
import { router } from './routes.js'
import { logger } from './logger.js'
import 'dotenv/config.js'

const app = express()
app.use(express.json())

// Routes
app.use(router)

app.use('/', (request, response) => {
	return response.send({
		about: 'Welcome Traveler!',
		docs: '',
		name: 'modrunner-api',
		version: meta.version,
	})
})

// Jobs
if (process.env.DOPPLER_ENVIRONMENT && (process.env.DOPPLER_ENVIRONMENT === 'stg' || process.env.DOPPLER_ENVIRONMENT === 'prd')) heartbeat.start()

// Start server
app.listen(process.env.CONFIG_SERVER_PORT, () => {
	logger.info(`Server listening on port ${process.env.CONFIG_SERVER_PORT}`)
})
