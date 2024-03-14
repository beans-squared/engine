import meta from '../package.json' assert { type: 'json' }
import 'dotenv/config'
import { cfetch } from '../util/cfetch'
import logger from '../logger'

export const modrinth = {
	config: {
		baseUrl: 'api.modrinth.com',
		version: 'v2',
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
			.catch((error) => logger.error(`Error on Modrinth data fetch at ${options.method ?? ''} ${path}`, error))
	},
	endpoints: {
		async searchProjects({ query }) {
			return await this.baseFetch(`/search?${new URLSearchParams({ query })}`, { method: 'GET' })
		},
		async getProject({ projectId }) {
			return await this.baseFetch(`/project/${projectId}`, { method: 'GET' })
		},
		async getProjects({ projectIds }) {
			return await this.baseFetch(`/projects?ids=[${projectIds.map((id) => '"' + id + '"')}]`, { method: 'GET' })
		},
		async checkProjectSlugOrIdVaildity({ idOrSlug }) {
			return await this.baseFetch(`/project/${idOrSlug}/check`, { method: 'GET' })
		},
		async listProjectVersions({ projectId }) {
			return await this.baseFetch(`/project/${projectId}/version`, { method: 'GET' })
		},
	},
}
