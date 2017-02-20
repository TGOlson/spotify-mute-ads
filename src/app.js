const { app, Tray, Menu } = require('electron');
const path = require('path');

const Logger = require('./logger');
const Requester = require('./spotify/requester');
const Stream = require('./spotify/stream');
const Actions = require('./spotify/actions');
const Mute = require('./volume/mute');

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
    { label: `${state.info}`, enabled: false, visible: state.info !== null },
    { type: 'separator' },
    { label: 'Quit', role: 'quit' },
  ]);

// const iconPath = path.join(__dirname, '..', 'images', 'icon.png');
const adIconPath = path.join(__dirname, '..', 'images', 'iconad.png');

const main = () => {
  app.on('ready', () => {
    app.dock.hide();

    const tray = new Tray(adIconPath);

    let state = {
      status: 'Connecting...',
      info: null,
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

      // if (isAd) tray.setImage(adIconPath);
      // if (!isAd) tray.setImage(iconPath);

      const info = isAd
        ? 'Playing: Ad (muted)'
        : `Playing: ${parsed.song} - ${parsed.artist}`;

      updateState({ info });
    };

    const connect = () =>
      Requester.makeSpotifyRequester(Logger)
      .then((r) => {
        updateState({ status: 'Connected' });
        return r;
      });

    const initialStatus = requester =>
      Actions.statusQuick(requester)
        .then(handleStatus)
        .then(() => requester);

    const handleError = (err) => {
      Logger.logError(err);

      // TODO: something nicer
      if (err.message === 'NoUserLoggedIn') {
        Logger.logInfo('Unable to connect. Retrying in 5s.');
        updateState({ status: 'Unable to connect to Spotify.' });

        /* eslint-disable no-use-before-define */
        setTimeout(() => run(), 5000);
        /* eslint-disable no-use-before-define */
      } else {
        app.quit();
      }
    };

    const run = () =>
      connect()
        .then(initialStatus)
        .then(Stream.statusStream(handleStatus))
        .catch(handleError);

    // TODO: should be separated out into own scope.
    // Take in app, return new state, etc.
    run().catch((err) => {
      Logger.logError('Unhandled exception. Quitting application.');
      Logger.logError(err);
      app.quit();
    });
  });

  // Un-mute when apps quits...
  app.on('quit', () => Mute.ensureMuteState(false));
};

module.exports = { main };
