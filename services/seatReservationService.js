const db = require('../db/database');
const { v4: uuidv4 } = require('uuid');
const { withLock } = require('../utils/concurrencyLock');

// Seat Reservation Service
const addSeatToTheater = (theaterId, seatNumber, category = 'standard') => {
  return new Promise((resolve, reject) => {
    const id = uuidv4();
    db.run(`INSERT INTO seats (id, theater_id, seat_number, is_reserved, category) VALUES (?, ?, ?, 0, ?)`,
      [id, theaterId, seatNumber, category], function(err) {
      if (err) reject(err);
      else resolve({ id, theaterId, seatNumber, isReserved: false, category });
    });
  });
};

// withLock prevents race conditions: only one reservation per seat key at a time
const reserveSeat = (theaterId, seatNumber, userId, movieId) => {
  return withLock(`seat:${theaterId}:${seatNumber}`, () => new Promise((resolve, reject) => {
    db.get(`SELECT id, is_reserved FROM seats WHERE theater_id = ? AND seat_number = ?`,
      [theaterId, seatNumber], (err, seat) => {
      if (err || !seat || seat.is_reserved) {
        return reject(new Error('Seat not available'));
      }
      const seatId = seat.id;
      const reservationId = uuidv4();
      db.run(`UPDATE seats SET is_reserved = 1 WHERE id = ?`, [seatId], (err) => {
        if (err) return reject(err);
        db.run(`INSERT INTO reservations (id, user_id, movie_id, seat_id, status) VALUES (?, ?, ?, ?, 'pending')`,
          [reservationId, userId, movieId, seatId], function(err) {
          if (err) reject(err);
          else resolve({ reservationId, seatId, status: 'pending' });
        });
      });
    });
  }));
};

const getReservationById = (id) => {
  return new Promise((resolve, reject) => {
    db.get(`SELECT * FROM reservations WHERE id = ?`, [id], (err, row) => {
      if (err) reject(err); else resolve(row);
    });
  });
};

// Cancel reservation: releases the seat and marks reservation as cancelled
const cancelReservation = (id) => {
  return new Promise((resolve, reject) => {
    db.get(`SELECT * FROM reservations WHERE id = ?`, [id], (err, reservation) => {
      if (err) return reject(err);
      if (!reservation) return reject(new Error('Reservation not found'));
      if (reservation.status === 'cancelled') return reject(new Error('Reservation already cancelled'));
      db.run(`UPDATE reservations SET status = 'cancelled' WHERE id = ?`, [id], (err) => {
        if (err) return reject(err);
        db.run(`UPDATE seats SET is_reserved = 0 WHERE id = ?`, [reservation.seat_id], (err) => {
          if (err) reject(err);
          else resolve({ id, status: 'cancelled', seatReleased: true });
        });
      });
    });
  });
};

module.exports = { addSeatToTheater, reserveSeat, getReservationById, cancelReservation };
