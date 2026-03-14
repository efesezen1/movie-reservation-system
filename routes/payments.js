const express = require('express');
const router = express.Router();
const paymentService = require('../services/paymentService');

/**
 * @swagger
 * tags:
 *   name: Payments
 *   description: Payments service endpoints (mock)
 */

// GET /payments/user/:userId — payment history for a user
router.get('/user/:userId', async (req, res) => {
  try {
    const payments = await paymentService.getPaymentsByUser(req.params.userId);
    res.json(payments);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /payments/:id — get single payment
router.get('/:id', async (req, res) => {
  try {
    const payment = await paymentService.getPaymentById(req.params.id);
    if (!payment) return res.status(404).json({ error: 'Payment not found' });
    res.json(payment);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /payments/:id/refund — process refund for a payment
router.post('/:id/refund', async (req, res) => {
  try {
    const result = await paymentService.processRefund(req.params.id);
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;
