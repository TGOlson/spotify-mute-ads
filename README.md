Mute Spotify ads when they come up.

```
$ npm install
$ npm run build
$ npm run open
```

TODO:
  * Better icons
  * Package
  * Name, `AdHawk`
  * Handle when spotify is not running
  * Handle when spotify helper is not running

App startup when spotify not running:
```
[INFO] Status change: {"error":{"type":"4110","message":"No user logged in"},"version":9,"client_version":"1.0.48.103.g15edf1ec","running":false}
```

Spotify shutdown while app running:
```
[INFO] Status change: {"version":9,"client_version":"1.0.48.103.g15edf1ec","server_time":1487467846,"online":false,"running":true}
```

Both result in actual error:
```
[ERROR] TypeError: Cannot read property 'track_type' of undefined
```

Fetching `csrf token` also returns a (`200` status) error response when spotify is not running
```
{"error": { "type": "4110", "message": "No user logged in" }, "version": 9, "client_version": "1.0.49.125.g72ee7853", "running": false}
```
