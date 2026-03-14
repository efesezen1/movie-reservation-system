const express = require('express');
const router = express.Router();
const movieService = require('../services/movieService');
const { requireAuth, requireRole } = require('../middleware/auth');
const { validate, Joi } = require('../middleware/validate');

/**
 * @swagger
 * tags:
 *   name: Movies
 *   description: Movies service endpoints
 */

const createSchema = Joi.object({
  title: Joi.string().min(1).required(),
  description: Joi.string().allow('', null),
  duration: Joi.number().integer().min(1).required(),
  theaterId: Joi.string().required(),
  showtime: Joi.string().required(),
});

const updateSchema = Joi.object({
  title: Joi.string().min(1),
  description: Joi.string().allow('', null),
  duration: Joi.number().integer().min(1),
  theaterId: Joi.string(),
  showtime: Joi.string(),
}).min(1);

/**
 * @swagger
 * /movies:
 *   post:
 *     summary: Create a new movie associated with theater
 *     tags: [Movies]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title: { type: string }
 *               description: { type: string }
 *               duration: { type: integer }
 *               theaterId: { type: string }
 *               showtime: { type: string }
 *     responses:
 *       201: { description: Movie created }
 */
router.post('/', validate(createSchema), async (req, res) => {
  try {
    const { title, description, duration, theaterId, showtime } = req.body;
    const movie = await movieService.createMovie(title, description, duration, theaterId, showtime);
    res.status(201).json(movie);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// GET /movies — list movies with pagination (?limit=&offset=)
router.get('/', async (req, res) => {
  try {
    const { limit, offset } = req.query;
    const movies = await movieService.getMovies(limit, offset);
    res.json(movies);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /movies/search — search & filter (?q=&showtime=&minDuration=&maxDuration=&theaterId=)
router.get('/search', async (req, res) => {
  try {
    const { q, showtime, minDuration, maxDuration, theaterId } = req.query;
    const movies = await movieService.searchMovies(q, { showtime, minDuration, maxDuration, theaterId });
    res.json(movies);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /movies/theater/:theaterId
router.get('/theater/:theaterId', async (req, res) => {
  try {
    const movies = await movieService.getMoviesByTheater(req.params.theaterId);
    res.json(movies);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /movies/:id
router.get('/:id', async (req, res) => {
  try {
    const movie = await movieService.getMovieById(req.params.id);
    if (!movie) return res.status(404).json({ error: 'Movie not found' });
    res.json(movie);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /movies/:id — update movie (admin only)
router.put('/:id', requireAuth, requireRole('admin'), validate(updateSchema), async (req, res) => {
  try {
    const result = await movieService.updateMovie(req.params.id, req.body);
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// DELETE /movies/:id — delete movie (admin only)
router.delete('/:id', requireAuth, requireRole('admin'), async (req, res) => {
  try {
    const result = await movieService.deleteMovie(req.params.id);
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;
