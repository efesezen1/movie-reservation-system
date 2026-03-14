const express = require('express');
const router = express.Router();
const theaterService = require('../services/theaterService');
const { requireAuth, requireRole } = require('../middleware/auth');
const { validate, Joi } = require('../middleware/validate');

/**
 * @swagger
 * tags:
 *   name: Theaters
 *   description: Theaters service endpoints
 */

const createSchema = Joi.object({
  name: Joi.string().min(1).required(),
  location: Joi.string().min(1).required(),
});

const updateSchema = Joi.object({
  name: Joi.string().min(1),
  location: Joi.string().min(1),
}).min(1);

const bulkSeatsSchema = Joi.object({
  seats: Joi.array().items(Joi.object({
    seatNumber: Joi.string().required(),
    category: Joi.string().valid('standard', 'vip', 'accessible').default('standard'),
  })).min(1).required(),
});

/**
 * @swagger
 * /theaters:
 *   post:
 *     summary: Create a new theater
 *     tags: [Theaters]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name: { type: string }
 *               location: { type: string }
 *     responses:
 *       201: { description: Theater created }
 */
router.post('/', validate(createSchema), async (req, res) => {
  try {
    const { name, location } = req.body;
    const theater = await theaterService.createTheater(name, location);
    res.status(201).json(theater);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// GET /theaters — list theaters with pagination (?limit=&offset=)
router.get('/', async (req, res) => {
  try {
    const { limit, offset } = req.query;
    const theaters = await theaterService.getTheaters(limit, offset);
    res.json(theaters);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /theaters/:id
router.get('/:id', async (req, res) => {
  try {
    const theater = await theaterService.getTheaterById(req.params.id);
    if (!theater) return res.status(404).json({ error: 'Theater not found' });
    res.json(theater);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /theaters/:id/seats
router.get('/:id/seats', async (req, res) => {
  try {
    const seats = await theaterService.getSeatsForTheater(req.params.id);
    res.json(seats);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /theaters/:id — update theater (admin only)
router.put('/:id', requireAuth, requireRole('admin'), validate(updateSchema), async (req, res) => {
  try {
    const result = await theaterService.updateTheater(req.params.id, req.body);
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// DELETE /theaters/:id — delete theater (admin only)
router.delete('/:id', requireAuth, requireRole('admin'), async (req, res) => {
  try {
    const result = await theaterService.deleteTheater(req.params.id);
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// POST /theaters/:id/seats/bulk — bulk add seats (admin only)
router.post('/:id/seats/bulk', requireAuth, requireRole('admin'), validate(bulkSeatsSchema), async (req, res) => {
  try {
    const result = await theaterService.bulkAddSeats(req.params.id, req.body.seats);
    res.status(201).json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;
