// Simple JWT util (offline, no deps) using Node crypto for HS256.
// For admin token only: sign/verify.
// Secret hardcoded (offline demo).

const crypto = require('crypto');
const SECRET = 'movie-admin-secret-key-offline';  // fixed for offline

// Sign simple JWT: header.payload.base64.signature
const signToken = (payload) => {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const body = Buffer.from(JSON.stringify({ ...payload, iat: Math.floor(Date.now() / 1000) })).toString('base64url');
  const sig = crypto.createHmac('sha256', SECRET).update(`${header}.${body}`).digest('base64url');
  return `${header}.${body}.${sig}`;
};

// Verify JWT (simple, no exp check for demo)
const verifyToken = (token) => {
  try {
    const [header, body, sig] = token.split('.');
    const expectedSig = crypto.createHmac('sha256', SECRET).update(`${header}.${body}`).digest('base64url');
    if (sig !== expectedSig) return null;
    return JSON.parse(Buffer.from(body, 'base64url').toString());
  } catch (e) {
    return null;
  }
};

module.exports = { signToken, verifyToken };