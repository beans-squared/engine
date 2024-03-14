import { logger } from '../logger'

export const cfetch = async (url, options = {}, maxRetries = 3) => {
	for (let i = maxRetries; i > 0; i--) {
		return await fetch(url, options).catch(error => logger.error(error));
	}
	return null;
}