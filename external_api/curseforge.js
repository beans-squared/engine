import meta from '../package.json' assert { type: 'json' }
import 'dotenv/config'
import { cfetch } from '../util/cfetch'
import logger from '../logger'

export const curseforge = {
	config: {
		baseUrl: 'api.curseforge.com',
		version: 'v1',
		apiKey: process.env.CURSEFORGE_API_KEY,
		userAgent: `modrunner/${meta.name}/${meta.version} (contact@modrunner.net)`,
		maxRetries: 3,
	},
	async baseFetch(path, options) {
		return await cfetch(
			`https://${this.baseUrl}/${this.version}${path}`,
			{
				headers: {
					'x-api-key': this.apiKey,
					'User-Agent': this.userAgent,
				},
				...options,
			},
			this.maxRetries
		)
			.then(async (response) => await response.json())
			.catch((error) => logger.error(`Error on CurseForge data fetch at ${options.method ?? ''} ${path}`, error))
	},
	endpoints: {
		/**
		 * Get all mods that match the search criteria.
		 */
		async searchMods({ gameId, searchFilter }) {
			return await this.baseFetch(`/mods/search?${new URLSearchParams({ gameId, searchFilter })}`, { method: 'GET' })
		},
		/**
		 * Get a single mod.
		 */
		async getMod({ modId }) {
			return await this.baseFetch(`/mods/${modId}`, { method: 'GET' })
		},
		/**
		 * Get a list of mods.
		 */
		async getMods({ modIds }) {
			return await this.baseFetch('/mods', { method: 'POST', body: JSON.stringify({ modIds: modIds, filterPcOnly: false }) })
		},
		/**
		 * Get the changelog of a file in HTML format.
		 */
		async getModFileChangelog({ modId, fileId }) {
			return await this.baseFetch(`/mods/${modId}/files/${fileId}/changelog`, { method: 'GET' })
		},
		/**
		 * Get a download url for a specific file.
		 */
		async getModFileDownloadUrl({ modId, fileId }) {
			return await this.baseFetch(`/mods/${modId}/files/${fileId}/download-url`, { method: 'GET' })
		},
	},
}
