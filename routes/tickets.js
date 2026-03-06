const express = require('express');
const router = express.Router();
const ticketService = require('../services/ticketService');

/**
 * @swagger
 * tags:
 *   name: Tickets
 *   description: Tickets service endpoints (bound to seat reservation and mock payment)
 */

/**
 * @swagger
 * /tickets/issue:
 *   post:
 *     summary: Issue ticket after mock payment confirmation (binds services)
 *     tags: [Tickets]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               reservationId: { type: string }
 *               amount: { type: number }
 *     responses:
 *       201: { description: Ticket issued }
 */
router.post('/issue', async (req, res) => {
  try {
    const { reservationId, amount } = req.body;
    const ticket = await ticketService.issueTicket(reservationId, amount);
    res.status(201).json(ticket);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// GET /tickets/:id
router.get('/:id', async (req, res) => {
  try {
    const ticket = await ticketService.getTicketById(req.params.id);
    if (!ticket) return res.status(404).json({ error: 'Ticket not found' });
    res.json(ticket);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /tickets/user/:userId
router.get('/user/:userId', async (req, res) => {
  try {
    const tickets = await ticketService.getTicketsByUser(req.params.userId);
    res.json(tickets);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;