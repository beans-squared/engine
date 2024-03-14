import meta from '../package.json' assert { type: 'json' }
import 'dotenv/config'
import { cfetch } from '../util/cfetch'
import logger from '../logger'

export const modio = {
	config: {
		baseUrl: 'u-29023658.modapi.io',
		version: 'v1',
		apiKey: process.env.MODIO_API_KEY,
		userAgent: `modrunner/${meta.name}/${meta.version} (contact@modrunner.net)`,
		maxRetries: 3,
	},
	async baseFetch(path, options) {
		return await cfetch(
			`https://${this.baseUrl}/${this.version}${path}?api_key=${this.apiKey}`,
			{
				headers: {
					'User-Agent': this.userAgent,
				},
				...options,
			},
			this.maxRetries
		)
			.then(async (response) => await response.json())
			.catch((error) => logger.error(`Error on Mod.io data fetch at ${options.method ?? ''} ${path}`, error))
	},
}