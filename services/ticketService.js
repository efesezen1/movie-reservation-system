const db = require('../db/database');
const { v4: uuidv4 } = require('uuid');
const crypto = require('crypto');
const paymentService = require('./paymentService');

// Ticket Service — bound to seat reservation and payment

// Generate a unique verifiable ticket token
const generateTicketToken = () => crypto.randomBytes(24).toString('hex');

const issueTicket = async (reservationId, amount = 10.0) => {
  // Guard: prevent duplicate tickets for the same reservation
  const existing = await new Promise((resolve, reject) => {
    db.get(`SELECT id FROM tickets WHERE reservation_id = ?`, [reservationId], (err, row) => {
      if (err) reject(err); else resolve(row);
    });
  });
  if (existing) throw new Error('A ticket has already been issued for this reservation');

  const payment = await paymentService.processMockPayment(reservationId, amount);
  if (payment.status !== 'confirmed') throw new Error('Payment failed');

  await new Promise((resolve, reject) => {
    db.run(`UPDATE reservations SET status = 'confirmed' WHERE id = ?`, [reservationId], (err) => {
      if (err) reject(err); else resolve();
    });
  });

  const ticketId = uuidv4();
  const token = generateTicketToken();

  await new Promise((resolve, reject) => {
    db.run(`INSERT INTO tickets (id, reservation_id, payment_id, status, token) VALUES (?, ?, ?, 'active', ?)`,
      [ticketId, reservationId, payment.id, token], function(err) {
      if (err) reject(err); else resolve();
    });
  });

  return { ticketId, reservationId, paymentId: payment.id, status: 'active', token };
};

const getTicketById = (id) => {
  return new Promise((resolve, reject) => {
    db.get(`SELECT * FROM tickets WHERE id = ?`, [id], (err, row) => {
      if (err) reject(err); else resolve(row);
    });
  });
};

const getTicketsByUser = (userId, limit, offset) => {
  return new Promise((resolve, reject) => {
    const l = parseInt(limit) || 20;
    const o = parseInt(offset) || 0;
    db.all(
      `SELECT t.* FROM tickets t
       JOIN reservations r ON t.reservation_id = r.id
       WHERE r.user_id = ?
       ORDER BY t.issued_at DESC LIMIT ? OFFSET ?`,
      [userId, l, o], (err, rows) => {
      if (err) reject(err); else resolve(rows);
    });
  });
};

const updateTicketStatus = (id, status) => {
  const allowed = ['active', 'used', 'expired', 'cancelled'];
  if (!allowed.includes(status)) throw new Error(`Invalid status. Must be one of: ${allowed.join(', ')}`);
  return new Promise((resolve, reject) => {
    db.run(`UPDATE tickets SET status = ? WHERE id = ?`, [status, id], function(err) {
      if (err) reject(err);
      else if (this.changes === 0) reject(new Error('Ticket not found'));
      else resolve({ id, status });
    });
  });
};

// Cancel ticket: sets status to cancelled and triggers refund on its payment
const cancelTicket = async (id) => {
  const ticket = await getTicketById(id);
  if (!ticket) throw new Error('Ticket not found');
  if (ticket.status === 'cancelled') throw new Error('Ticket already cancelled');

  await updateTicketStatus(id, 'cancelled');

  // Attempt refund (non-blocking: if already refunded, silently skip)
  try {
    await paymentService.processRefund(ticket.payment_id);
  } catch (_) {}

  return { id, status: 'cancelled', refundAttempted: true };
};

module.exports = { issueTicket, getTicketById, getTicketsByUser, updateTicketStatus, cancelTicket };
