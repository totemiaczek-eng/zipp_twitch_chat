# Wrist Chat

A read-only Twitch chat viewer for the Amazfit Active 2 (Square). Chat appears on the watch; a Node.js relay joins Twitch chat anonymously, and the Zepp companion service fetches recent messages over HTTPS and forwards them to the watch over Bluetooth. The app does not send chat messages or require Twitch credentials.

## Requirements

- Node.js 20 or newer and npm
- A Twitch channel that is currently live
- A publicly reachable HTTPS deployment for the relay (the Zepp companion service runs inside the Zepp phone app and cannot use your PC's `localhost`)
- Zepp OS developer account and Zeus CLI; replace the sample `appId` with the ID assigned to your app

## Configure the relay

Set `TWITCH_CHANNEL` to the channel's login name (the project defaults to `miwca`), then start the relay:

```powershell
$env:TWITCH_CHANNEL = "miwca"
npm install
npm run relay
```

The relay serves `GET /health` and `GET /chat`. It exposes only recent public chat and contains no endpoint for sending messages. Deploy it behind HTTPS before connecting the watch.

## Deploy the relay for free on Render

The root `render.yaml` configures a free Render web service for the `miwca` relay.

1. Push this project, including `render.yaml`, to a GitHub repository.
2. Create a Render account, choose **New** > **Blueprint**, and connect that repository.
3. Deploy the `wrist-chat-miwca-relay` service. Copy its `https://...onrender.com` URL and confirm that `<URL>/health` returns `ok: true`.
4. Set `RELAY_URL` in `app-side/settings.js` to that exact HTTPS origin, without a trailing slash, then rebuild and preview the watch app.

Render's free web services sleep after 15 minutes without inbound traffic and may restart. When the watch next requests chat, the first request can take about a minute to wake the relay; the in-memory chat buffer is cleared whenever the service restarts.

## Configure the Zepp app

1. Replace `1000000` in `app.json` with the app ID assigned by Zepp.
2. Set `RELAY_URL` in `app-side/settings.js` to the deployed HTTPS origin, without a trailing slash.
3. Install dependencies and build with `npm install` then `npm run build`.
4. Install or preview the generated Zepp package using the Zepp developer workflow for the Active 2 Square.

The target is device source `10223873`, Active 2 Square's global device variant, with a square-screen 390 px design width. The view refreshes every eight seconds. Tap **OLDER** to load earlier messages in the relay's recent buffer.

## Tests

```powershell
npm test
```

The tests cover channel normalization and Twitch IRC chat parsing. The relay buffer is in memory and resets when the process restarts.
