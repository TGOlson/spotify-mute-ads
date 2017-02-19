/* eslint-disable no-console */
const logInfo = payload => console.log(`[INFO] ${payload}`);
const logError = error => console.error(`[ERROR] ${error}`);
/* eslint-enable no-console */

module.exports = { logInfo, logError };
