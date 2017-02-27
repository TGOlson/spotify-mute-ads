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

const getSong = track =>
  track.track_resource ? track.track_resource.name : 'Unknown song title';

const getArtist = track =>
  track.artist_resource ? track.artist_resource.name : 'Unknown artist name';

// parseStatus :: Status -> Either Ad SongInfo
const parseStatus = ({ track }) =>
  track.track_type === 'ad'
    ? { type: 'ad' }
    : {
      type: 'song',
      song: truncate(getSong(track), 20),
      artist: truncate(getArtist(track), 20),
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
  // TODO: should probably be in library cache dir
  const logFile = path.join(app.getPath('userData'), 'client.log');

  const logger = Logger.composeLoggers(
    Logger.makeConsoleLogger(),
    Logger.makeFileLogger(logFile)
  );

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
      logger.info(`Status change: ${JSON.stringify(status)}`);

      const parsed = parseStatus(status);
      logger.info(`Parsed status: ${JSON.stringify(parsed)}`);

      const isAd = parsed.type === 'ad';

      Mute.ensureMuteState(logger, isAd);

      // if (isAd) tray.setImage(adIconPath);
      // if (!isAd) tray.setImage(iconPath);

      const info = isAd
        ? 'Playing: Ad (muted)'
        : `Playing: ${parsed.song} - ${parsed.artist}`;

      updateState({ info });
    };

    const connect = () =>
      Requester.makeSpotifyRequester(logger)
        .then((r) => {
          updateState({ status: 'Connected' });
          return r;
        });

    const initialStatus = requester =>
      Actions.statusQuick(requester)
        .then(handleStatus)
        .then(() => requester);

    const handleError = (err) => {
      logger.error(err);

      // TODO: something nicer
      if (err.message === 'NoUserLoggedIn') {
        logger.info('Unable to connect. Retrying in 5s.');
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
      logger.error('Unhandled exception. Quitting application.');
      logger.error(err);
      app.quit();
    });
  });

  // Un-mute when apps quits...
  app.on('quit', () => Mute.ensureMuteState(logger, false));
};

module.exports = { main };
