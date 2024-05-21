import { logger } from '../logger.js'

export async function cfetch(url: string, options = {}, maxRetries = 3): Promise<Response | null | void> {
	for (let i = maxRetries; i > 0; i--) {
		return await fetch(url, options).catch((error) => logger.error(error))
	}
	return null
}
