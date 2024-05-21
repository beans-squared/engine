import { CronJob } from 'cron'
import { logger } from '../../logger.js'
import 'dotenv/config'

export const nexusmodsJobs = new CronJob('0 * * * * *', () => {})
