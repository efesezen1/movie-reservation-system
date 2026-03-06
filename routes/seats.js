const express = require('express');
const router = express.Router();
const seatReservationService = require('../services/seatReservationService');

/**
 * @swagger
 * tags:
 *   name: Seats
 *   description: Seats reservation service endpoints (bound to reservations)
 */

/**
 * @swagger
 * /seats/add:
 *   post:
 *     summary: Add a seat to a theater (setup)
 *     tags: [Seats]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               theaterId: { type: string }
 *               seatNumber: { type: string }
 *     responses:
 *       201: { description: Seat added }
 */
router.post('/add', async (req, res) => {
  try {
    const { theaterId, seatNumber } = req.body;
    const seat = await seatReservationService.addSeatToTheater(theaterId, seatNumber);
    res.status(201).json(seat);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

/**
 * @swagger
 * /seats/reserve:
 *   post:
 *     summary: Reserve a seat (binds to user, movie, reservation)
 *     tags: [Seats]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               theaterId: { type: string }
 *               seatNumber: { type: string }
 *               userId: { type: string }
 *               movieId: { type: string }
 *     responses:
 *       201: { description: Seat reserved }
 */
router.post('/reserve', async (req, res) => {
  try {
    const { theaterId, seatNumber, userId, movieId } = req.body;
    const reservation = await seatReservationService.reserveSeat(theaterId, seatNumber, userId, movieId);
    res.status(201).json(reservation);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// GET /seats/reservations/:id
router.get('/reservations/:id', async (req, res) => {
  try {
    const reservation = await seatReservationService.getReservationById(req.params.id);
    if (!reservation) return res.status(404).json({ error: 'Reservation not found' });
    res.json(reservation);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;