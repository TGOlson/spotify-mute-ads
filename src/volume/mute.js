const exec = require('child_process').execSync;

const isMuted = () => {
  const cmd = 'osascript -e "output muted of (get volume settings)"';
  const res = exec(cmd).toString().trim();

  if (res === 'true') return true;
  if (res === 'false') return false;

  throw new Error(`Unexpected command response: ${res}`);
};

const setMute = (mute) => {
  const cmd = mute ? 'with' : 'without';
  exec(`osascript -e "set volume ${cmd} output muted"`);
};

const ensureMuteState = (logger, shouldMute) => {
  logger.info(`Ensuring mute state: ${shouldMute}`);

  const muted = isMuted();

  logger.info(`Current mute state: ${muted}`);

  if (muted === shouldMute) {
    logger.info('Current mute state matches desired state. Not taking action.');
  } else {
    logger.info(`Current mute state does not match desired state. Setting mute: ${shouldMute}`);
    // If it is already muted, and "muted" === true, then there is nothing to do.
    // Similarly, if it is not muted and "shouldMute" === false, there is also nothing to do.
    // The only time we need to toggle mute is if the current state !== to the desired state.

    setMute(shouldMute);
  }
};

module.exports = { ensureMuteState };
