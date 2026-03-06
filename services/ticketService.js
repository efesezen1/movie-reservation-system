const db = require('../db/database');
const { v4: uuidv4 } = require('uuid');
const paymentService = require('./paymentService');  // mock payment

// Ticket Service - bound to seat reservation and payment
// After reservation, proceed to mock payment, then issue ticket

const issueTicket = async (reservationId, amount = 10.0) => {  // mock amount
  try {
    // Mock payment
    const payment = await paymentService.processMockPayment(reservationId, amount);
    if (payment.status !== 'confirmed') {
      throw new Error('Payment failed');
    }
    // Update reservation status
    await new Promise((resolve, reject) => {
      db.run(`UPDATE reservations SET status = 'confirmed' WHERE id = ?`, [reservationId], (err) => {
        if (err) reject(err); else resolve();
      });
    });
    // Create ticket
    const ticketId = uuidv4();
    await new Promise((resolve, reject) => {
      db.run(`INSERT INTO tickets (id, reservation_id, payment_id) VALUES (?, ?, ?)`, 
        [ticketId, reservationId, payment.id], function(err) {
        if (err) reject(err); else resolve();
      });
    });
    return { ticketId, reservationId, paymentId: payment.id, status: 'issued' };
  } catch (err) {
    throw err;
  }
};

const getTicketById = (id) => {
  return new Promise((resolve, reject) => {
    db.get(`SELECT * FROM tickets WHERE id = ?`, [id], (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
};

const getTicketsByUser = (userId) => {
  return new Promise((resolve, reject) => {
    db.all(`SELECT t.* FROM tickets t 
            JOIN reservations r ON t.reservation_id = r.id 
            WHERE r.user_id = ?`, [userId], (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
};

module.exports = { issueTicket, getTicketById, getTicketsByUser };