const { verifyToken } = require('../utils/jwt');

// Middleware: require a valid JWT (any role)
const requireAuth = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authorization token required' });
  }
  const payload = verifyToken(authHeader.split(' ')[1]);
  if (!payload) return res.status(401).json({ error: 'Invalid or expired token' });
  req.user = payload;
  next();
};

// Middleware: require a specific role (use after requireAuth)
const requireRole = (role) => (req, res, next) => {
  if (!req.user || req.user.role !== role) {
    return res.status(403).json({ error: 'Forbidden: insufficient permissions' });
  }
  next();
};

module.exports = { requireAuth, requireRole };
