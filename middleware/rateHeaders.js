// Rate Limiter Headers Middleware
// Separate to respect edit limits on rateLimiter.js; same logic for IP/calc.
// Adds standard headers to all responses: X-RateLimit-Limit, X-RateLimit-Remaining, X-RateLimit-Reset.
// For admin JWT (from /admin/signin): bypass rate limit (unlimited Remaining).
// Keeps app offline/no deps. Used with rateLimiter for services.

const rateLimitStore = new Map();  // duplicate store sync w/ main limiter (IP -> {count, resetTime})
const { verifyToken } = require('./../utils/jwt');  // for admin bypass
const { withLock } = require('./../utils/concurrencyLock');  // serialize to prevent race on store

const rateHeaders = (req, res, next) => {
  // Check for admin JWT first (bypass rate for valid token)
  let isAdmin = false;
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    const payload = verifyToken(token);
    if (payload && payload.role === 'admin') {
      isAdmin = true;
    }
  }

  // Same IP norm as rateLimiter.js for consistency
  // DEBUG: log to confirm execution
  let ip = req.ip || req.connection?.remoteAddress || req.socket?.remoteAddress || 'unknown';
  if (ip.includes('::ffff:')) ip = ip.split('::ffff:')[1];
  if (ip === '::1') ip = '127.0.0.1';
  console.log(`RateHeaders: IP=${ip}, isAdmin=${isAdmin}, setting headers`);  // TEMP DEBUG to terminal
  const now = Date.now();
  const windowMs = 60 * 1000;
  const limit = isAdmin ? 999999 : 7;  // unlimited for admin JWT

  // Wrap critical store access with lock (key=ip) to eliminate race conditions on concurrent reqs
  withLock(`rate:${ip}`, async () => {
    if (!rateLimitStore.has(ip)) {
      rateLimitStore.set(ip, { count: 0, resetTime: now + windowMs });
    }
    const record = rateLimitStore.get(ip);

    // Sync reset
    if (now > record.resetTime) {
      record.count = 0;
      record.resetTime = now + windowMs;
    }

    // For admin JWT: unlimited , no count inc or store
    let remaining;
    if (isAdmin) {
      remaining = 999999;  // unlimited
    } else {
      // Calc remaining (pre-increment for accuracy)
      remaining = Math.max(0, limit - record.count);
      // Inc count here too for header sync (main limiter handles block)
      record.count += 1;
    }

    // Set headers on response
    res.set({
      'X-RateLimit-Limit': limit,
      'X-RateLimit-Remaining': remaining,
      'X-RateLimit-Reset': Math.ceil((record.resetTime - now) / 1000)
    });

    // Cleanup (only for non-admin)
    if (!isAdmin && Math.random() < 0.01) {
      for (let [key, val] of rateLimitStore) {
        if (now > val.resetTime) rateLimitStore.delete(key);
      }
    }

    return;  // lock released
  }).then(() => next()).catch((err) => next(err));  // ensure next
};

module.exports = rateHeaders;