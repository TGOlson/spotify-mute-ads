const DEFAULT_RETURN_ON = ['login', 'logout', 'play', 'pause', 'error', 'ap'];

const statusInternal = returnafter => requester =>
  requester.get('/remote/status.json', {
    returnafter,
    returnon: DEFAULT_RETURN_ON.join(','),
  });

const status = statusInternal(59);
const statusQuick = statusInternal(1);

module.exports = { status, statusQuick };
