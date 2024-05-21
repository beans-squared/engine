import { CronJob } from 'cron'
import { logger } from '../../logger.js'
import 'dotenv/config'

export const modioJob = new CronJob('0 * * * * *', () => {})
