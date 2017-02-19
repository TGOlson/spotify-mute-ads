const DEFAULT_RETURN_ON = ['login', 'logout', 'play', 'pause', 'error', 'ap'];

const status = returnafter => requester =>
  requester.get('/remote/status.json', {
    returnafter,
    returnon: DEFAULT_RETURN_ON.join(','),
  });

module.exports = { status };
