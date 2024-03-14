import logger from '../logger'

export async function logger(request, response, next) {
	log.info(`Recieved request from ${request.hostname} (${request.ip}) at route ${request.method} ${request.originalUrl}`)
	next()
}
