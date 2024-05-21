import { cfetch } from '../util/cfetch.js'
import { logger } from '../logger.js'
import meta from '../package.json'
import 'dotenv/config'

export const github = {
	config: {
		baseUrl: 'api.github.com',
		version: null,
		apiKey: null,
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
			logger.error(`Error on GitHub data fetch at ${options.method ?? ''} ${path}`, error)
		} finally {
			return null
		}
	},
}
