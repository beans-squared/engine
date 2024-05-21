import { CronJob } from 'cron'
import { logger } from '../../logger.js'
import 'dotenv/config'

export const ftbJob = new CronJob('0 * * * * *', () => {})
