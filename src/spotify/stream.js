const Actions = require('./actions');

// statusStream :: (Status -> ()) -> SpotifyRequester -> Promise ()
const statusStream = callback => requester =>
  Actions.status(requester)
    .then(callback)
    .then(() => statusStream(callback)(requester));

module.exports = { statusStream };
