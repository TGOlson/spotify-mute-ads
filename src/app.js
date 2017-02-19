const Requester = require('./spotify/requester');
const Stream = require('./spotify/stream');
const Mute = require('./volume/mute');
const Logger = require('./logger');

const statusIsAd = status =>
  status.track.track_type === 'ad';

const muteVolumeIfAd = status =>
  statusIsAd(status) ? Mute.ensureMuteState(true) : Mute.ensureMuteState(false);

const handleStatusChange = (status) => {
  Logger.logInfo(`Status change: ${JSON.stringify(status)}`);
  muteVolumeIfAd(status);
};

const main = () =>
  Requester.makeSpotifyRequester()
    .then(Stream.statusStream(handleStatusChange))
    .catch(Logger.logError);

module.exports = { main };
