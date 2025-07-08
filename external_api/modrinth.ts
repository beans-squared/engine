import { cfetch } from '../util/cfetch.js'
import { logger } from '../logger.js'
import meta from '../package.json' with { type: 'json'}
import 'dotenv/config'

export const modrinth = {
	config: {
		baseUrl: 'api.modrinth.com',
		version: 'v2',
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
			logger.error(`Error on Modrinth data fetch at ${options.method ?? ''} ${path}`, error)
		} finally {
			return null
		}
	},
	endpoints: {
		async searchProjects(query: string, limit?: number) {
			return await modrinth.baseFetch(`/search?${new URLSearchParams({ query })}` + `&limit=${limit ?? 10}`, { method: 'GET' })
		},
		async getProject(projectId: string) {
			return await modrinth.baseFetch(`/project/${projectId}`, { method: 'GET' })
		},
		async getProjects(projectIds: string[]) {
			return await modrinth.baseFetch(`/projects?ids=[${projectIds.map((id) => '"' + id + '"')}]`, { method: 'GET' })
		},
		async checkProjectSlugOrIdVaildity(idOrSlug: string) {
			return await modrinth.baseFetch(`/project/${idOrSlug}/check`, { method: 'GET' })
		},
		async listProjectVersions(projectId: string) {
			return await modrinth.baseFetch(`/project/${projectId}/version`, { method: 'GET' })
		},
	},
}
