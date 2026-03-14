const { verifyToken } = require('../utils/jwt');

const rateLimitStore = new Map();  // IP -> { count, resetAt }
const WINDOW_MS = 60 * 1000;  // 1 minute
const MAX_REQUESTS = 7;

const rateLimiter = (req, res, next) => {
  // Admin JWT bypass
  const authHeader = req.headers['authorization'];
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const payload = verifyToken(authHeader.split(' ')[1]);
    if (payload && payload.role === 'admin') return next();
  }

  let ip = req.ip || req.connection?.remoteAddress || 'unknown';
  if (ip.includes('::ffff:')) ip = ip.split('::ffff:')[1];
  if (ip === '::1') ip = '127.0.0.1';

  const now = Date.now();

  if (!rateLimitStore.has(ip) || now > rateLimitStore.get(ip).resetAt) {
    rateLimitStore.set(ip, { count: 0, resetAt: now + WINDOW_MS });
  }

  const record = rateLimitStore.get(ip);
  record.count++;

  if (record.count > MAX_REQUESTS) {
    return res.status(429).json({ error: 'Rate limit exceeded. Max 7 requests/min per IP.' });
  }

  next();
};

module.exports = rateLimiter;
