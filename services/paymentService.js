const db = require('../db/database');
const { v4: uuidv4 } = require('uuid');

// Mock Payment Service - no real internet, always can confirm for demo (keep real except payment)
const processMockPayment = (reservationId, amount) => {
  return new Promise((resolve, reject) => {
    const id = uuidv4();
    // Mock: 90% success, but for simplicity, always confirm unless amount=0
    const status = amount > 0 ? 'confirmed' : 'failed';
    db.run(`INSERT INTO payments (id, reservation_id, amount, status) VALUES (?, ?, ?, ?)`, 
      [id, reservationId, amount, status], function(err) {
      if (err) reject(err);
      else resolve({ id, reservationId, amount, status });
    });
  });
};

const getPaymentById = (id) => {
  return new Promise((resolve, reject) => {
    db.get(`SELECT * FROM payments WHERE id = ?`, [id], (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
};

module.exports = { processMockPayment, getPaymentById };