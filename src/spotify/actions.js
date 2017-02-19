const DEFAULT_RETURN_AFTER = 59;
const DEFAULT_RETURN_ON = ['login', 'logout', 'play', 'pause', 'error', 'ap'];

const status = requester =>
  requester.get('/remote/status.json', {
    returnafter: DEFAULT_RETURN_AFTER,
    returnon: DEFAULT_RETURN_ON.join(','),
  });


module.exports = { status };
