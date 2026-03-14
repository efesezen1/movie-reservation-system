const express = require('express');
const router = express.Router();
const userService = require('../services/userService');
const { signToken } = require('../utils/jwt');
const { requireAuth, requireRole } = require('../middleware/auth');
const { validate, Joi } = require('../middleware/validate');

/**
 * @swagger
 * tags:
 *   name: Users
 *   description: Users service endpoints
 */

const registerSchema = Joi.object({
  name: Joi.string().min(1).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
});

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required(),
});

const updateSchema = Joi.object({
  name: Joi.string().min(1),
  email: Joi.string().email(),
  password: Joi.string().min(6),
}).min(1);

/**
 * @swagger
 * /users:
 *   post:
 *     summary: Register a new user
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name: { type: string }
 *               email: { type: string }
 *               password: { type: string }
 *     responses:
 *       201: { description: User created }
 */
router.post('/', validate(registerSchema), async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const user = await userService.createUser(name, email, password);
    res.status(201).json(user);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// POST /users/signin — user login, returns JWT
router.post('/signin', validate(loginSchema), async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await userService.loginUser(email, password);
    if (!user) return res.status(401).json({ error: 'Invalid email or password' });
    const token = signToken({ id: user.id, email: user.email, role: user.role });
    res.json({ token, user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /users — list users with pagination (?limit=&offset=)
router.get('/', async (req, res) => {
  try {
    const { limit, offset } = req.query;
    const users = await userService.getUsers(limit, offset);
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /users/:id
router.get('/:id', async (req, res) => {
  try {
    const user = await userService.getUserById(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /users/:id — update user (requires auth)
router.put('/:id', requireAuth, validate(updateSchema), async (req, res) => {
  try {
    const result = await userService.updateUser(req.params.id, req.body);
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// DELETE /users/:id — delete user (admin only)
router.delete('/:id', requireAuth, requireRole('admin'), async (req, res) => {
  try {
    const result = await userService.deleteUser(req.params.id);
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;
