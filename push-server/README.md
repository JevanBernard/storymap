# StoryMap Push Server (example)

This is a minimal example push server using Express and web-push to demonstrate server-side storage of subscriptions and sending push notifications.

Usage

1. Install dependencies:

```powershell
cd push-server; npm install
```

2. Start the server:

```powershell
npm start
```

The server will generate `vapid.json` on first run and print the `vapidPublicKey` in console.

Endpoints

- `GET /` — returns `{ status: 'ok', vapidPublicKey }`.
- `POST /subscribe` — save push subscription (body: subscription JSON).
- `POST /unsubscribe` — remove subscription (body: { endpoint }).
- `POST /send` — admin send push to all subscriptions (body: { title, body, icon, url }).

Notes

- This is for demo/testing only (stores subscriptions in `db.json` using lowdb).
- Use the printed VAPID public key to configure your client (set `VAPID_PUBLIC_KEY` in `notification-helper.js` or change `StoryApi` to point to this server for register/unregister).
