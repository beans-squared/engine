import { cfetch } from '../util/cfetch.js'
import { logger } from '../logger.js'
import meta from '../package.json' with { type: 'json' }
import 'dotenv/config'

export const curseforge = {
	config: {
		baseUrl: 'api.curseforge.com',
		version: 'v1',
		apiKey: process.env.API_KEY_CURSEFORGE,
		userAgent: `modrunner/${meta.name}/${meta.version} (contact@modrunner.net)`,
		maxRetries: 3,
	},
	async baseFetch<ResponseType>(path: string, options: RequestInit): Promise<Response | null | void> {
		try {
			return await cfetch(
				`https://${this.config.baseUrl}/${this.config.version}${path}`,
				{
					headers: {
						'Content-Type': 'application/json',
						'x-api-key': this.config.apiKey,
						'User-Agent': this.config.userAgent,
					},
					...options,
				},
				this.config.maxRetries
			)
		} catch (error) {
			logger.error(`Error on CurseForge data fetch at ${options.method ?? ''} ${path}: ${error}`)
			return null
		}
	},
	endpoints: {
		/**
		 * Get all mods that match the search criteria.
		 */
		async searchMods(gameId: number, searchFilter: string) {
			return await curseforge.baseFetch(`/mods/search?${new URLSearchParams(`gameId=${gameId.toString()}&searchFilter=${searchFilter}`)}`, { method: 'GET' })
		},
		/**
		 * Get a single mod.
		 */
		async getMod(modId: string): Promise<{ data: Mod } | null | undefined> {
			const response = await curseforge.baseFetch(`/mods/${modId}`, { method: 'GET' })
			if (response) {
				if (response.status >= 200 && response.status < 300) {
					return await response.json() as { data: Mod }
				} else if (response.status === 404) {
					return null
				}
			} else {
				throw new Error('Failed to fetch mod from CurseForge')
			}
		},
		/**
		 * Get a list of mods.
		 */
		async getMods(modIds: string[]) {
			return (await curseforge.baseFetch('/mods', { method: 'POST', body: JSON.stringify({ modIds: modIds, filterPcOnly: false }) })) as { data: Mod[] }
		},
		/**
		 * Get the changelog of a file in HTML format.
		 */
		async getModFileChangelog(modId: string, fileId: string) {
			return await curseforge.baseFetch(`/mods/${modId}/files/${fileId}/changelog`, { method: 'GET' })
		},
		/**
		 * Get a download url for a specific file.
		 */
		async getModFileDownloadUrl(modId: string, fileId: string) {
			return await curseforge.baseFetch(`/mods/${modId}/files/${fileId}/download-url`, { method: 'GET' })
		},
	},
}

interface File {
	id: number
	gameId: number
	displayName: string
	fileName: string
	releaseType: FileReleaseType
	fileDate: string
	downloadUrl: string
}

enum FileReleaseType {
	Release = 1,
	Beta = 2,
	Alpha = 3,
}

interface Mod {
	id: number
	gameId: number
	name: string
	slug: string
	summary: string
	downloadCount: number
	isFeatured: boolean
	primaryCategoryId: number
	classId: number
	authors: ModAuthor[]
	logo: ModAsset
	latestFiles: File[]
	dateReleased: string
}

interface ModAsset {
	id: number
	modId: number
	title: string
	description: string
	thumbnailUrl: string
	url: string
}

interface ModAuthor {
	id: number
	name: string
	url: string
}
