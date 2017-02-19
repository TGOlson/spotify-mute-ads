const Actions = require('./actions');

// statusStream :: (Status -> ()) -> SpotifyRequester -> Promise ()
const statusStream = returnafter => callback => requester =>
  Actions.status(returnafter)(requester)
    .then(callback)
    .then(() => statusStream(callback)(requester));

module.exports = { statusStream };
