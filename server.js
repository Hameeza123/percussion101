const express = require('express');
const crypto = require('crypto');
const app = express();

const TAWK_SECRET = process.env.TAWK_SECRET;

if (!TAWK_SECRET) {
  console.error('Error: set TAWK_SECRET environment variable');
  // continue — endpoint will return error
}

// Simple endpoint to generate server-signed visitor HMAC for Tawk
app.get('/api/tawk-hash', (req, res) => {
  const visitorId = (req.query.id || req.query.email || '').toString();
  if (!visitorId) return res.status(400).json({ error: 'missing id' });
  if (!TAWK_SECRET) return res.status(500).json({ error: 'server misconfigured' });
  try {
    const hash = crypto.createHmac('sha256', TAWK_SECRET).update(visitorId).digest('hex');
    res.json({ visitorId, hash });
  } catch (e) {
    res.status(500).json({ error: 'hash error' });
  }
});

// Serve static files for local testing (optional)
app.use(express.static(''));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log('Tawk hash server listening on port', PORT));
