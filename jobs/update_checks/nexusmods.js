import { CronJob } from 'cron'
import logger from '../logger'
import 'dotenv/config'

export const nexusmodsJobs = new CronJob('0 * * * * *', () => {})
