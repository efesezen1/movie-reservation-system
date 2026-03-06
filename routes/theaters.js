const express = require('express');
const router = express.Router();
const theaterService = require('../services/theaterService');

/**
 * @swagger
 * tags:
 *   name: Theaters
 *   description: Theaters service endpoints
 */

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
router.post('/', async (req, res) => {
  try {
    const { name, location } = req.body;
    const theater = await theaterService.createTheater(name, location);
    res.status(201).json(theater);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// GET /theaters - List theaters
router.get('/', async (req, res) => {
  try {
    const theaters = await theaterService.getTheaters();
    res.json(theaters);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /theaters/:id - Get theater
router.get('/:id', async (req, res) => {
  try {
    const theater = await theaterService.getTheaterById(req.params.id);
    if (!theater) return res.status(404).json({ error: 'Theater not found' });
    res.json(theater);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /theaters/:id/seats - Get seats for theater
router.get('/:id/seats', async (req, res) => {
  try {
    const seats = await theaterService.getSeatsForTheater(req.params.id);
    res.json(seats);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;