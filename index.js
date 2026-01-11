const express = require('express');
const cors = require("cors");
const rateLimit = require('express-rate-limit');

const app = express();
app.use(cors());
app.set('trust proxy', true);

// Load reasons from JSON
// Using require allows the JSON to be bundled easily for Cloudflare Workers
const reasons = require('./reasons.json');

// Rate limiter: 120 requests per minute per IP
// Note: In Cloudflare Workers, this in-memory limit resets when the worker scales or restarts.
// For production use on CF, consider using Cloudflare's native 'Rate Limiting' features.
const limiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 120,
  keyGenerator: (req, res) => {
    return req.headers['cf-connecting-ip'] || req.ip; 
  },
  message: { error: "Too many requests, please try again later. (120 reqs/min/IP)" }
});

app.use(limiter);

// Random rejection reason endpoint
app.get('/no', (req, res) => {
  const reason = reasons[Math.floor(Math.random() * reasons.length)];
  res.json({ reason });
});

// Start server only if run directly (node index.js)
if (require.main === module) {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`No-as-a-Service is running on port ${PORT}`);
  });
}

// Export the app for Cloudflare Workers compatibility
module.exports = app;
