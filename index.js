import express from 'express'
import packageMeta from './package.json' assert { type: 'json' }
import { logger } from './middleware/logger'
import heartbeat from './jobs/heartbeat'
import 'dotenv/config.js'

const app = express()
app.use(express.json())

// Middleware
app.use(logger)

// Routes

app.use('/', (request, response) => {
	return response.send({
		about: 'Welcome Traveler!',
		docs: '',
		name: 'modrunner-api',
		version: packageMeta.version,
	})
})

// Jobs
heartbeat.start()

// Start server
app.listen(process.env.PORT, () => {
	console.log(`Server listening on port ${process.env.PORT}`)
})
