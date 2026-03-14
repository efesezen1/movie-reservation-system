const db = require('../db/database');
const { v4: uuidv4 } = require('uuid');

// Mock Payment Service
const processMockPayment = (reservationId, amount) => {
  return new Promise((resolve, reject) => {
    const id = uuidv4();
    const status = amount > 0 ? 'confirmed' : 'failed';
    db.run(`INSERT INTO payments (id, reservation_id, amount, status, refunded) VALUES (?, ?, ?, ?, 0)`,
      [id, reservationId, amount, status], function(err) {
      if (err) reject(err);
      else resolve({ id, reservationId, amount, status });
    });
  });
};

const getPaymentById = (id) => {
  return new Promise((resolve, reject) => {
    db.get(`SELECT * FROM payments WHERE id = ?`, [id], (err, row) => {
      if (err) reject(err); else resolve(row);
    });
  });
};

const getPaymentsByUser = (userId) => {
  return new Promise((resolve, reject) => {
    db.all(
      `SELECT p.* FROM payments p
       JOIN reservations r ON p.reservation_id = r.id
       WHERE r.user_id = ?
       ORDER BY p.created_at DESC`,
      [userId], (err, rows) => {
      if (err) reject(err); else resolve(rows);
    });
  });
};

// Refund: marks payment as refunded (mock — no real money movement)
const processRefund = (paymentId) => {
  return new Promise((resolve, reject) => {
    db.get(`SELECT * FROM payments WHERE id = ?`, [paymentId], (err, payment) => {
      if (err) return reject(err);
      if (!payment) return reject(new Error('Payment not found'));
      if (payment.refunded) return reject(new Error('Payment already refunded'));
      if (payment.status !== 'confirmed') return reject(new Error('Only confirmed payments can be refunded'));
      db.run(`UPDATE payments SET refunded = 1, status = 'refunded' WHERE id = ?`, [paymentId], function(err) {
        if (err) reject(err);
        else resolve({ id: paymentId, status: 'refunded', amount: payment.amount });
      });
    });
  });
};

module.exports = { processMockPayment, getPaymentById, getPaymentsByUser, processRefund };
