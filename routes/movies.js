const express = require('express');
const router = express.Router();
const movieService = require('../services/movieService');

/**
 * @swagger
 * tags:
 *   name: Movies
 *   description: Movies service endpoints
 */

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
router.post('/', async (req, res) => {
  try {
    const { title, description, duration, theaterId, showtime } = req.body;
    const movie = await movieService.createMovie(title, description, duration, theaterId, showtime);
    res.status(201).json(movie);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// GET /movies - List movies
router.get('/', async (req, res) => {
  try {
    const movies = await movieService.getMovies();
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

// GET /movies/theater/:theaterId
router.get('/theater/:theaterId', async (req, res) => {
  try {
    const movies = await movieService.getMoviesByTheater(req.params.theaterId);
    res.json(movies);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;