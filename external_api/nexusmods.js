import meta from '../package.json' assert { type: 'json' }
import 'dotenv/config'
import { cfetch } from '../util/cfetch'
import logger from '../logger'

export const nexusmods = {
	config: {
		baseUrl: 'api.nexusmods.com',
		version: 'v2',
		apiKey: process.env.NEXUSMODS_API_KEY,
		userAgent: `modrunner/${meta.name}/${meta.version} (contact@modrunner.net)`,
		maxRetries: 3,
	},
	async baseFetch(path, options) {
		return await cfetch(
			`https://${this.baseUrl}/${this.version}${path}`,
			{
				headers: {
					'apikey': this.apiKey,
					'User-Agent': this.userAgent,
				},
				...options,
			},
			this.maxRetries
		)
			.then(async (response) => await response.json())
			.catch((error) => logger.error(`Error on Nexus Mods data fetch at ${options.method ?? ''} ${path}`, error))
	},
}
