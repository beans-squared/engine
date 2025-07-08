import { cfetch } from '../util/cfetch.js'
import { logger } from '../logger.js'
import meta from '../package.json' with { type: 'json' }
import 'dotenv/config'

export const discord = {
	config: {
		baseUrl: 'discord.com/api',
		version: 'v10',
		apiKey: process.env.API_KEY_DISCORD,
		userAgent: `Modrunner (modrunner.net, ${meta.version})`,
		maxRetries: 3,
	},
	async baseFetch<ResponseType>(path: string, options: RequestInit): Promise<Response | null | void> {
		try {
			return await cfetch(
				`https://${this.config.baseUrl}/${this.config.version}${path}`,
				{
					headers: {
						'Content-Type': 'application/json',
						'Authorization': `Bot ${this.config.apiKey}`,
						'User-Agent': this.config.userAgent,
					},
					...options,
				},
				this.config.maxRetries
			)
		} catch (error) {
			logger.error(`Error on Discord data fetch at ${options.method ?? ''} ${path}: ${error}`)
			return null
		}
	},
	endpoints: {},
}