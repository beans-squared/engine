import meta from '../package.json' assert { type: 'json' }
import 'dotenv/config'
import { cfetch } from '../util/cfetch'
import logger from '../logger'

export const github = {
	config: {
		baseUrl: 'api.github.com',
		version: null,
		apiKey: null,
		userAgent: `modrunner/${meta.name}/${meta.version} (contact@modrunner.net)`,
		maxRetries: 3,
	},
	async baseFetch(path, options) {
		return await cfetch(
			`https://${this.baseUrl}/${this.version}${path}`,
			{
				headers: {
					'User-Agent': this.userAgent,
				},
				...options,
			},
			this.maxRetries
		)
			.then(async (response) => await response.json())
			.catch((error) => logger.error(`Error on GitHub data fetch at ${options.method ?? ''} ${path}`, error))
	},
}
