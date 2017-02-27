const fs = require('fs');

const now = () => new Date().toISOString();

const makeLogger = writer => ({
  info: payload => writer(`[INFO] ${now()} - ${payload}`),
  error: error => writer(`[ERROR] ${now()} - ${error}\n${error.stack}`),
});

/* eslint-disable no-console */
const makeConsoleLogger = () => makeLogger(x => console.log(x));
/* eslint-enable no-console */

const makeFileLogger = path => makeLogger(x => fs.appendFile(path, `${x}\n`));

const composeLoggers = (l1, l2) => ({
  info: (x) => {
    l1.info(x);
    l2.info(x);
  },
  error: (x) => {
    l1.error(x);
    l2.error(x);
  },
});

module.exports = { makeConsoleLogger, makeFileLogger, composeLoggers };
