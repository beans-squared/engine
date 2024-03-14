import { CronJob } from 'cron'
import logger from '../logger'
import 'dotenv/config'

export default new CronJob('0 */5 * * * *', () => {
	fetch(process.env.BETTERSTACK_HEARTBEAT_URL).catch((error) => logger.error(error))
})
