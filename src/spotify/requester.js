const request = require('request-promise');
const qs = require('querystring');

// data SpotifyRequester = SpotifyRequester
//   { get a :: UrlPath -> Params -> Promise a }

// makeSpotifyRequester :: Promise (Either SpotifyRequestError SpotifyRequester)
const makeSpotifyRequester = (logger) => {
  const subDomain = 'skip-ads'; // Doesn't matter, can be random
  const domain = 'spotilocal.com';
  const port = 4370;

  const baseUrl = `https://${subDomain}.${domain}:${port}`;

  const headers = { Origin: 'https://open.spotify.com' };
  const baseRequester = (url) => {
    logger.info(`Making request to ${url}`);
    return request({ url, headers, json: true })
      .then((r) => {
        logger.info(`Response: ${JSON.stringify(r)}`);

        // TODO: better error inspection
        if (r.error) {
          throw new Error('NoUserLoggedIn');
        }

        return r;
      });
  };

  const getOAuthToken = () =>
    baseRequester('https://open.spotify.com/token')
      .then(r => r.t);

  const getCsrfToken = () =>
    baseRequester(`${baseUrl}/simplecsrf/token.json`)
      .then(r => r.token);

  return Promise.all([getOAuthToken(), getCsrfToken()])
    .then(([oauth, csrf]) => {
      const authParams = { oauth, csrf };

      const get = (path, params) => {
        const fullParms = Object.assign({}, params, authParams);
        const url = `${baseUrl}${path}?${qs.stringify(fullParms)}`;

        return baseRequester(url);
      };

      return { get };
    });
};

module.exports = { makeSpotifyRequester };
