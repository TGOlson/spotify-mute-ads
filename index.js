const Requester = require('./spotify/requester');
const Stream = require('./spotify/stream');
const Mute = require('./volume/mute');

const logStatus = (status) => console.log('Status:\n\t', status)
const logError  = (error) => console.error('Error:\n\t', error)

const handleStatusChange = (status) => {
  logStatus(status)
  muteVolumeIfAd(status)
}

const statusIsAd = (status) =>
  status.track.track_type === 'ad';

const muteVolumeIfAd = (status) =>
  statusIsAd(status) ? Mute.ensureMuteState(true) : Mute.ensureMuteState(false)

Requester.makeSpotifyRequester()
  .then(Stream.statusStream(handleStatusChange))
  .catch(logError)

// { version: 9,
//   client_version: '1.0.48.103.g15edf1ec',
//   playing: true,
//   shuffle: false,
//   repeat: false,
//   play_enabled: true,
//   prev_enabled: false,
//   next_enabled: false,
//   track: { track_type: 'ad' },
//   context: {},
//   playing_position: 0,
//   server_time: 1487463164,
//   volume: 1,
//   online: true,
//   open_graph_state: { private_session: false, posting_disabled: true },
//   running: true }

// { version: 9,
//   client_version: '1.0.48.103.g15edf1ec',
//   playing: true,
//   shuffle: false,
//   repeat: false,
//   play_enabled: true,
//   prev_enabled: false,
//   next_enabled: false,
//   track: { length: 15, track_type: 'ad' },
//   context: {},
//   playing_position: 15.118,
//   server_time: 1487463201,
//   volume: 1,
//   online: true,
//   open_graph_state: { private_session: false, posting_disabled: true },
//   running: true }

// { version: 9,
//   client_version: '1.0.48.103.g15edf1ec',
//   playing: false,
//   shuffle: false,
//   repeat: false,
//   play_enabled: true,
//   prev_enabled: true,
//   next_enabled: true,
//   track:
//    { track_resource:
//       { name: '...And the Gods Made Love',
//         uri: 'spotify:track:4COmeKH1pLNNpXcgtMcyQH',
//         location: [Object] },
//      artist_resource:
//       { name: 'Jimi Hendrix',
//         uri: 'spotify:artist:776Uo845nYHJpNaStv1Ds4',
//         location: [Object] },
//      album_resource:
//       { name: 'Electric Ladyland',
//         uri: 'spotify:album:5z090LQztiqh13wYspQvKQ',
//         location: [Object] },
//      length: 82,
//      track_type: 'normal' },
//   context: {},
//   playing_position: 22.825,
//   server_time: 1487463223,
//   volume: 1,
//   online: true,
//   open_graph_state: { private_session: false, posting_disabled: true },
//   running: true }
