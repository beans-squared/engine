import { drizzle } from 'drizzle-orm/libsql'
import * as schema from './database/schema.js'
export const database = drizzle({ connection: { url: 'file:database.sqlite' }, schema: schema })
