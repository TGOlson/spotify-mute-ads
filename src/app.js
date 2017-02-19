const { app, Tray, Menu } = require('electron');

const Requester = require('./spotify/requester');
const Stream = require('./spotify/stream');
const Actions = require('./spotify/actions');
const Mute = require('./volume/mute');
const Logger = require('./logger');

const truncate = (str, length) =>
  str.length > length
    ? `${str.substring(0, length - 3)}...`
    : str;

// parseStatus :: Status -> Either Ad SongInfo
const parseStatus = ({ track }) =>
  track.track_type === 'ad'
    ? { type: 'ad' }
    : {
      type: 'song',
      song: truncate(track.track_resource.name, 20),
      artist: truncate(track.artist_resource.name, 20),
    };

const buildMenu = state =>
  Menu.buildFromTemplate([
    { label: `Status: ${state.status}`, enabled: false },
    { label: `Playing: ${state.playing}`, enabled: false, hidden: state.status !== 'Connected' },
    { type: 'separator' },
    { label: 'Quit', role: 'quit' },
  ]);

const main = () => {
  app.on('ready', () => {
    app.dock.hide();

    const tray = new Tray('./images/icongrey.png');

    let state = {
      status: 'Connected',
      playing: 'Waiting for status',
    };

    const setMenu = st => tray.setContextMenu(buildMenu(st));

    const updateState = (st) => {
      const newState = Object.assign({}, state, st);
      state = newState;
      setMenu(state);
    };

    setMenu(state);

    const handleStatus = (status) => {
      Logger.logInfo(`Status change: ${JSON.stringify(status)}`);

      const parsed = parseStatus(status);
      Logger.logInfo(`Parsed status: ${JSON.stringify(parsed)}`);

      const isAd = parsed.type === 'ad';

      Mute.ensureMuteState(isAd);

      if (isAd) tray.setImage('./images/iconpurp.png');
      if (!isAd) tray.setImage('./images/icongrey.png');

      const playing = isAd
        ? 'Ad (muted)'
        : `${parsed.song} - ${parsed.artist}`;

      updateState({ playing });
    };

    Requester.makeSpotifyRequester()
      .then(requester =>
        // Initial status request should return quickly...
        Actions.statusQuick(requester)
          .then(handleStatus)
          .then(() => requester)
      )
      .then(Stream.statusStream(handleStatus))
      .catch((err) => {
        Logger.logError(err);
        app.quit();
      });
  });

  // Un-mute when apps quits...
  app.on('quit', () => Mute.ensureMuteState(false));
};

module.exports = { main };
