const express = require('express');
const bodyParser = require('body-parser');
const webpush = require('web-push');
// Use simple JSON file storage to avoid lowdb compatibility issues
const { nanoid } = require('nanoid');
const path = require('path');
const fs = require('fs');

const app = express();
app.use(bodyParser.json());
// Simple CORS headers for local development so browser clients can call this server
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  // respond to preflight
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});

// Simple JSON DB helpers (file-based)
const dbFile = path.join(__dirname, 'db.json');

function readDbSync() {
  try {
    if (!fs.existsSync(dbFile)) return { subscriptions: [] };
    const raw = fs.readFileSync(dbFile, 'utf8');
    if (!raw) return { subscriptions: [] };
    const data = JSON.parse(raw);
    return data || { subscriptions: [] };
  } catch (err) {
    console.warn('readDbSync error:', err.message);
    return { subscriptions: [] };
  }
}

function writeDbSync(data) {
  try {
    fs.writeFileSync(dbFile, JSON.stringify(data, null, 2));
  } catch (err) {
    console.error('writeDbSync error:', err.message);
  }
}

async function initDb() {
  const data = readDbSync();
  writeDbSync(data);
  return;
}

// VAPID keys file
const vapidFile = path.join(__dirname, 'vapid.json');
let vapidKeys;
if (fs.existsSync(vapidFile)) {
  vapidKeys = JSON.parse(fs.readFileSync(vapidFile));
} else {
  vapidKeys = webpush.generateVAPIDKeys();
  fs.writeFileSync(vapidFile, JSON.stringify(vapidKeys, null, 2));
  console.log('Generated VAPID keys and saved to vapid.json');
}

webpush.setVapidDetails(
  'mailto:admin@example.com',
  vapidKeys.publicKey,
  vapidKeys.privateKey
);

app.get('/', (req, res) => {
  res.json({ status: 'ok', vapidPublicKey: vapidKeys.publicKey });
});

app.post('/subscribe', async (req, res) => {
  const sub = req.body;
  if (!sub || !sub.endpoint) return res.status(400).json({ error: true, message: 'Invalid subscription' });
    const dbData = readDbSync();
    const exists = dbData.subscriptions.find(s => s.subscription.endpoint === sub.endpoint);
  if (!exists) {
     dbData.subscriptions.push({ id: nanoid(), subscription: sub });
     writeDbSync(dbData);
  }
  res.json({ success: true, message: 'Subscription saved' });
});

app.post('/unsubscribe', async (req, res) => {
  const { endpoint } = req.body;
  if (!endpoint) return res.status(400).json({ error: true, message: 'Missing endpoint' });
    const dbData = readDbSync();
    dbData.subscriptions = dbData.subscriptions.filter(s => s.subscription.endpoint !== endpoint);
    writeDbSync(dbData);
  res.json({ success: true, message: 'Subscription removed' });
});

// Admin send push — accepts { title, body, icon, url }
app.post('/send', async (req, res) => {
  const { title, body, icon, url } = req.body;
  if (!title || !body) return res.status(400).json({ error: true, message: 'Missing title/body' });
    const dbData = readDbSync();
    const subs = dbData.subscriptions || [];
  const payload = JSON.stringify({ title, body, icon, url });

  const results = [];
  for (const record of subs) {
    try {
      await webpush.sendNotification(record.subscription, payload);
      results.push({ endpoint: record.subscription.endpoint, status: 'ok' });
    } catch (err) {
      console.warn('Failed to send to', record.subscription.endpoint, err.message);
      results.push({ endpoint: record.subscription.endpoint, status: 'failed', error: err.message });
    }
  }

  res.json({ success: true, results });
});

const PORT = process.env.PORT || 4000;
initDb().then(() => {
  app.listen(PORT, () => {
    console.log(`Push server running on http://localhost:${PORT}`);
    console.log(`VAPID public key: ${vapidKeys.publicKey}`);
  });
});
