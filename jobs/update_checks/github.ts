import { CronJob } from 'cron'
import { logger } from '../../logger.js'
import 'dotenv/config'

export const githubJob = new CronJob('0 * * * * *', () => {})
