import { CronJob } from 'cron'
import logger from '../logger'
import 'dotenv/config'

export const modioJob = new CronJob('0 * * * * *', () => {})
