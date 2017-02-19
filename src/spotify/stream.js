const Actions = require('./actions');

// statusStream :: (Status -> ()) -> SpotifyRequester -> Promise ()
const statusStream = (cb) => (requester) =>
  Actions.status(requester)
    .then(cb)
    .then(() => statusStream(cb)(requester))

//   return undefined;
// }

module.exports = { statusStream }
