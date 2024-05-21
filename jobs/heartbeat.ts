import { CronJob } from 'cron'
import { logger } from '../logger.js'
import 'dotenv/config'

export default new CronJob('0 */5 * * * *', () => {
	if (process.env.CONFIG_HEARTBEAT_URL) {
		fetch(process.env.CONFIG_HEARTBEAT_URL).catch((error) => logger.error(error))
	} else {
		logger.warn('There is no defined heartbeat url.')
	}
})
