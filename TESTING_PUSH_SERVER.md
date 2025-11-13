# Testing Push Notifications Locally

This guide explains how to test push notifications with the example push server included in `push-server/`.

## Prerequisites

- Node.js installed
- npm installed
- The main app running locally or deployed

## Step 1: Start the Local Push Server

```powershell
cd push-server
npm start
```

Expected output:
```
Generated VAPID keys and saved to vapid.json
Push server running on http://localhost:4000
VAPID public key: BC...
```

The server will automatically generate VAPID keys on first run and save them to `vapid.json`.

## Step 2: Start the Main App

In a new terminal, run the app in development mode:

```powershell
npm run start-dev
```

Or build and serve locally:

```powershell
npm run build
npm run serve
```

Then open `http://localhost:8080` (or wherever the app is running).

## Step 3: Enable Push Notifications

1. Open the app in your browser.
2. Login or register.
3. In the navigation menu, toggle **"Notifikasi"** (Notifications) to ON.
4. Grant browser permission when prompted.
5. You should see a console message (in DevTools) confirming subscription was saved.

### Notes

- The app will first try to register the subscription with the primary API (`https://story-api.dicoding.dev/v1/subscribe`).
- If that fails, it will fall back to the local push server (`http://localhost:4000/subscribe`).
- The subscription endpoint will be stored in IndexedDB locally and in the push server's `db.json`.

## Step 4: Send a Test Push Notification

From your terminal or using a tool like `curl`, send a push to all subscribed clients:

```powershell
curl -X POST http://localhost:4000/send `
  -H "Content-Type: application/json" `
  -d @{
    "title" = "Test Notification"
    "body" = "This is a test push from the example server"
    "icon" = "icons/icon-192x192.png"
    "url" = "/#/stories"
  }
```

Or using PowerShell (more naturally):

```powershell
$payload = @{
    title = "Cerita Baru!"
    body = "Ada cerita baru yang menarik. Klik untuk lihat."
    icon = "icons/icon-192x192.png"
    url = "/#/stories"
} | ConvertTo-Json

Invoke-WebRequest -Uri http://localhost:4000/send `
  -Method POST `
  -ContentType application/json `
  -Body $payload
```

## Step 5: Verify Notification in Browser

- A notification should appear on your system (or browser notification, depending on OS).
- Clicking the notification should navigate to the specified URL (e.g., `/#/stories`).
- The Service Worker will log the notification event in browser DevTools Console.

## Troubleshooting

**Issue: Push server fails to start**
- Ensure port 4000 is free. Change port in `push-server/server.js` if needed.

**Issue: Subscription fails**
- Check browser console for errors.
- Ensure Service Worker is registered (DevTools → Application → Service Workers).
- Verify push permission is granted in browser settings.

**Issue: Notification doesn't show**
- Check if your OS allows notifications from the browser.
- Verify subscription was saved (check `push-server/db.json`).
- Check browser console for Service Worker errors.

## Deployment

For production:

1. The main app is deployed to GitHub Pages.
2. You need to deploy a push server (e.g., to Heroku, Firebase Cloud Functions, or your own server).
3. Update the API base URL in `src/scripts/utils/notification-helper.js` and `src/scripts/data/story-api.js` to point to your production push server instead of localhost.
4. Update the VAPID public key in `notification-helper.js` to match your production server's VAPID public key.

For now, the app will gracefully fall back to the local dev push server if the primary API endpoints are unavailable.
