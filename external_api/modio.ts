import { cfetch } from '../util/cfetch.js'
import { logger } from '../logger.js'
import meta from '../package.json'
import 'dotenv/config'

export const modio = {
	config: {
		baseUrl: 'u-29023658.modapi.io',
		version: 'v1',
		apiKey: process.env.API_KEY_MODIO,
		userAgent: `modrunner/${meta.name}/${meta.version} (contact@modrunner.net)`,
		maxRetries: 3,
	},
	async baseFetch(path: string, options: RequestInit) {
		try {
			const response = await cfetch(
				`https://${this.config.baseUrl}/${this.config.version}${path}`,
				{
					headers: {
						'User-Agent': this.config.userAgent,
					},
					...options,
				},
				this.config.maxRetries
			)

			if (response) {
				return await response.json()
			}
		} catch (error) {
			logger.error(`Error on Mod.io data fetch at ${options.method ?? ''} ${path}`, error)
		} finally {
			return null
		}
	},
}