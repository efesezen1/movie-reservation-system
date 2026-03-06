const db = require('../db/database');
const { v4: uuidv4 } = require('uuid');

// Seat Reservation Service
// Bound to seats and reservations

const addSeatToTheater = (theaterId, seatNumber) => {
  return new Promise((resolve, reject) => {
    const id = uuidv4();
    db.run(`INSERT INTO seats (id, theater_id, seat_number, is_reserved) VALUES (?, ?, ?, 0)`, 
      [id, theaterId, seatNumber], function(err) {
      if (err) reject(err);
      else resolve({ id, theaterId, seatNumber, isReserved: false });
    });
  });
};

const reserveSeat = (theaterId, seatNumber, userId, movieId) => {
  return new Promise((resolve, reject) => {
    // Check if seat available
    db.get(`SELECT id, is_reserved FROM seats WHERE theater_id = ? AND seat_number = ?`, 
      [theaterId, seatNumber], (err, seat) => {
      if (err || !seat || seat.is_reserved) {
        return reject(new Error('Seat not available'));
      }
      const seatId = seat.id;
      const reservationId = uuidv4();
      // Update seat reserved
      db.run(`UPDATE seats SET is_reserved = 1 WHERE id = ?`, [seatId], (err) => {
        if (err) return reject(err);
        // Create reservation
        db.run(`INSERT INTO reservations (id, user_id, movie_id, seat_id, status) VALUES (?, ?, ?, ?, 'pending')`, 
          [reservationId, userId, movieId, seatId], function(err) {
          if (err) reject(err);
          else resolve({ reservationId, seatId, status: 'pending' });
        });
      });
    });
  });
};

const getReservationById = (id) => {
  return new Promise((resolve, reject) => {
    db.get(`SELECT * FROM reservations WHERE id = ?`, [id], (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
};

module.exports = { addSeatToTheater, reserveSeat, getReservationById };