var exec = require('child_process').execSync;

const isMuted = () => {
  const cmd = 'osascript -e "output muted of (get volume settings)"';
  const res = exec(cmd).toString().trim()

  if      (res === 'true')  return true
  else if (res === 'false') return false
  else throw new Error(`Unexpected command response: ${res}`)
};

const setMute = (mute) => {
  console.log(`Setting mute: ${mute}`)
  const cmd = mute ? 'with' : 'without';
  exec(`osascript -e "set volume ${cmd} output muted"`)
}

const ensureMuteState = (shouldMute) =>
  // If it is already muted, and "muted" === true, then there is nothing to do.
  // Similarly, if it is not muted and "shouldMute" === false, there is also nothing to do.
  // The only time we need to toggle mute is if the current state !== to the desired state.
  (isMuted() == shouldMute) ? null : setMute(shouldMute);

module.exports = { ensureMuteState };
