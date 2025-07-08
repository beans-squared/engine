import * as d from 'drizzle-orm/sqlite-core'

export const discordChannel = d.sqliteTable('discord_channel', {
	id: d.text().primaryKey(),
	name: d.text(),
	settingNotifStyle: d.text(),
	settingChangelogLength: d.integer(),
})

export const discordGuild = d.sqliteTable('discord_guild', {
	id: d.text().primaryKey(),
	name: d.text(),
	maxTrackedProjects: d.integer().default(100),
	settingNotifStyle: d.text(),
	settingChangelogLength: d.integer(),
})

export const notification = d.sqliteTable('notification', {
	id: d.integer().primaryKey({ autoIncrement: true }),
	datePosted: d.integer({ mode: 'timestamp' }).notNull(),
	status: d.text({ enum: ['pending', 'success', 'failure'] }).notNull(),
	message: d.text(),
	discordChannelProjectId: d.text(),
	discordUserProjectId: d.text(),
})

export const project = d.sqliteTable(
	'project',
	{
		id: d.text(),
		platform: d.text({ enum: ['CurseForge', 'FeedTheBeast', 'GitHub', 'Mod.io', 'Modrinth', 'NexusMods'] }).notNull(),
		name: d.text().notNull(),
		gameId: d.text().notNull(),
		logoUrl: d.text().notNull(),
		dateUpdated: d.integer({ mode: 'timestamp' }).notNull(),
	},
	(table) => {
		return {
			pk: d.primaryKey({ columns: [table.id, table.platform] }),
		}
	}
)

export const projectVersion = d.sqliteTable(
	'project_version',
	{
		id: d.text(),
		projectId: d.text(),
		projectPlatform: d.text(),
		datePublished: d.integer({ mode: 'timestamp' }),
	},
	(table) => {
		return {
			pk: d.primaryKey({ columns: [table.id, table.projectId, table.projectPlatform] }),
			projectReference: d.foreignKey({
				columns: [table.projectId, table.projectPlatform],
				foreignColumns: [project.id, project.platform],
			}),
		}
	}
)

export const trackedProject = d.sqliteTable(
	'tracked_project',
	{
		projectId: d.text(),
		projectPlatform: d.text(),
		discordChannelId: d.text().references(() => discordChannel.id),
		settingNotifStyle: d.text(),
		settingChangelogLength: d.integer(),
	},
	(table) => {
		return {
			pk: d.primaryKey({ columns: [table.projectId, table.projectPlatform, table.discordChannelId] }),
			projectReference: d.foreignKey({
				columns: [table.projectId, table.projectPlatform],
				foreignColumns: [project.id, project.platform],
			}),
		}
	}
)
