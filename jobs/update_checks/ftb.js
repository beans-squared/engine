import { CronJob } from 'cron'
import logger from '../logger'
import 'dotenv/config'

export const ftbJob = new CronJob('0 * * * * *', () => {})
