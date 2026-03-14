const express = require('express');
const router = express.Router();
const ticketService = require('../services/ticketService');
const { validate, Joi } = require('../middleware/validate');

/**
 * @swagger
 * tags:
 *   name: Tickets
 *   description: Tickets service endpoints (bound to seat reservation and mock payment)
 */

const issueSchema = Joi.object({
  reservationId: Joi.string().required(),
  amount: Joi.number().min(0).default(10.0),
});

const statusSchema = Joi.object({
  status: Joi.string().valid('active', 'used', 'expired', 'cancelled').required(),
});

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
router.post('/issue', validate(issueSchema), async (req, res) => {
  try {
    const { reservationId, amount } = req.body;
    const ticket = await ticketService.issueTicket(reservationId, amount);
    res.status(201).json(ticket);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// GET /tickets/user/:userId — get tickets by user with pagination (?limit=&offset=)
router.get('/user/:userId', async (req, res) => {
  try {
    const { limit, offset } = req.query;
    const tickets = await ticketService.getTicketsByUser(req.params.userId, limit, offset);
    res.json(tickets);
  } catch (err) {
    res.status(500).json({ error: err.message });
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

// PATCH /tickets/:id/status — update ticket status
router.patch('/:id/status', validate(statusSchema), async (req, res) => {
  try {
    const result = await ticketService.updateTicketStatus(req.params.id, req.body.status);
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// DELETE /tickets/:id — cancel ticket (triggers refund)
router.delete('/:id', async (req, res) => {
  try {
    const result = await ticketService.cancelTicket(req.params.id);
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;
