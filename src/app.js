const { app, Tray, Menu } = require('electron');
const path = require('path');

const Logger = require('./logger');
const Requester = require('./spotify/requester');
const Stream = require('./spotify/stream');
const Actions = require('./spotify/actions');
const Mute = require('./volume/mute');

const merge = (o1, o2) => Object.assign({}, o1, o2);
const set = (o, k, v) => merge(o, { [k]: v });

const truncate = (str, length) =>
  str.length > length
    ? `${str.substring(0, length - 3)}...`
    : str;

const getSong = track =>
  track.track_resource ? track.track_resource.name : 'Unknown song title';

const getArtist = track =>
  track.artist_resource ? track.artist_resource.name : 'Unknown artist name';

// parseStatus :: Status -> Either Ad SongInfo
const getSongInfo = ({ track }) =>
  track.track_type === 'ad'
    ? { type: 'ad' }
    : {
      type: 'song',
      song: truncate(getSong(track), 20),
      artist: truncate(getArtist(track), 20),
    };

// const buildMenu = state =>
//   Menu.buildFromTemplate([
//     { label: `Status: ${state.status}`, enabled: false },
//     { label: `${state.info}`, enabled: false, visible: state.info !== null },
//     { type: 'separator' },
//     { label: 'Quit', role: 'quit' },
//   ]);

// const iconPath = path.join(__dirname, '..', 'images', 'icon.png');
const adIconPath = path.join(__dirname, '..', 'images', 'iconad.png');

// data State = State
//    { connectionStatus :: ConnectionStatus
//    , songInfo         :: Maybe SongInfo
//    , userMuted        :: Bool
//    }

// data ConnectionStatus = NotConnected | Connecting | Connected | Disconnected
// data SongInfo = Ad | Song (Text, Text)

// data Action
//    = ConnectionStatusChange ConnectionStatus
//    | StatusChange Status

// runState :: State -> Action -> State


const runState = (state, action) => {
  switch (action.type) {
    case 'ConnectionStatusChange':
      return set(state, 'connectionStatus', action.connectionStatus);
    case 'StatusChange': {
      // Disconnected
      // if (!status.online) {
      //   return handleError(new Error('SpotifyOffline'));
      // }

      const songInfo = getSongInfo(state.status);

      return set(state, 'songInfo', songInfo);
    }
    default: throw new Error(`Unexpected action: ${action}`);
  }
};

const renderState = (emit, logger, tray, state) => {
  // TODO: isAd & info depend on connectionStatus...
  const isAd = state.songInfo !== null && state.songInfo.type === 'ad';
  const info = 'bar';

  //   const info = isAd
  //     ? 'Playing: Ad (muted)'
  //     : `Playing: ${state.songInfo.song} - ${state.songInfo.artist}`;

  Mute.ensureMuteState(logger, isAd);

  const menu = Menu.buildFromTemplate([
    { label: `Status: ${state.connectionStatus}`, enabled: false },
    { label: `${info}`, enabled: false, visible: info !== null },
    { type: 'separator' },
    { label: 'Quit', role: 'quit' },
  ]);

  tray.setContextMenu(menu);
};

const runApp = (emit, logger, readyApp) => {
  const handleStatus = (status) => {
    logger.info(`Status change: ${JSON.stringify(status)}`);
    emit({ type: 'StatusChange', status });
  };

  const handleError = (err) => {
    logger.error(err);

    // TODO: something nicer
    if (err.message === 'NoUserLoggedIn' || err.message === 'SpotifyOffline') {
      logger.info(`Unable to connect due to ${err.message}. Retrying in 5s.`);
      emit({ type: 'ConnectionStatusChange', connectionStatus: 'Disconnected' });

      /* eslint-disable no-use-before-define */
      // TODO: this is too heavy handed...
      // Instead let handlers try to reconnect
      setTimeout(() => runApp(emit, logger, readyApp), 5000);
      /* eslint-disable no-use-before-define */
    } else {
      logger.error('Unhandled exception. Quitting application.');
      readyApp.quit();
    }
  };

  // TODO: connection flow should be in 'renderState'
  // When not connected, attempt to connect and emit...?
  // Probably need another handler for generating actions
  return Requester.makeSpotifyRequester(logger).then((r) => {
    emit({ type: 'ConnectionStatusChange', connectionStatus: 'Connected' });
    return r;
  }).then(requester =>
    Actions.statusQuick(requester)
      .then(handleStatus)
      .then(() => requester)
  ).then(Stream.statusStream(handleStatus))
    .catch(handleError);
};

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
      connectionStatus: 'NotConnected',
      songInfo: null,
      userMuted: false,
    };

    const emit = (act) => {
      logger.info(`Action: ${JSON.stringify(act)}`);
      logger.info(`Prev state: ${JSON.stringify(state)}`);

      state = runState(state, act);
      logger.info(`New state: ${JSON.stringify(state)}`);

      renderState(emit, logger, tray, state);
    };

    emit({ type: 'ConnectionStatusChange', connectionStatus: 'Connecting' });

    runApp(emit, logger, app);
  });

  // Un-mute when apps quits...
  app.on('quit', () => Mute.ensureMuteState(logger, false));
};

module.exports = { main };
