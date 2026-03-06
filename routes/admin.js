const express = require('express');
const router = express.Router();
const { signToken } = require('../utils/jwt');

/**
 * @swagger
 * tags:
 *   name: Admin
 *   description: Admin signin for JWT (bypasses rate limit on all services)
 */

/**
 * @swagger
 * /admin/signin:
 *   post:
 *     summary: Admin signin - returns JWT token (bypass rate limiting)
 *     tags: [Admin]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username: { type: string, example: admin }
 *               password: { type: string, example: adminpass }
 *     responses:
 *       200: { description: JWT token returned }
 */
router.post('/signin', (req, res) => {
  try {
    const { username, password } = req.body;
    // Admin only: hardcoded creds (offline , real , no DB dep for security demo)
    if (username !== 'admin' || password !== 'adminpass') {
      return res.status(401).json({ error: 'Invalid admin credentials' });
    }
    // Sign JWT (simple crypto , offline)
    const token = signToken({ role: 'admin', username: 'admin' });
    res.json({ token, user: { username: 'admin', role: 'admin' }, message: 'Admin JWT issued - use in Authorization: Bearer <token> to bypass rate limit on services' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /admin/verify - Optional to test token
router.get('/verify', (req, res) => {
  res.json({ message: 'Admin endpoint , rate limit bypassed if valid JWT' });
});

module.exports = router;