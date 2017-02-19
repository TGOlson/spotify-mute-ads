const now = () => new Date().toISOString();

/* eslint-disable no-console */
const logInfo = payload => console.log(`[INFO] ${now()} - ${payload}`);
const logError = error => console.error(`[ERROR] ${now()} - ${error}\n${error.stack}`);
/* eslint-enable no-console */


module.exports = { logInfo, logError };
