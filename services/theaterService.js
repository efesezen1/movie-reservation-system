const db = require('../db/database');
const { v4: uuidv4 } = require('uuid');

// Theater Service
const createTheater = (name, location) => {
  return new Promise((resolve, reject) => {
    const id = uuidv4();
    db.run(`INSERT INTO theaters (id, name, location) VALUES (?, ?, ?)`, [id, name, location], function(err) {
      if (err) reject(err);
      else resolve({ id, name, location });
    });
  });
};

const getTheaters = (limit, offset) => {
  return new Promise((resolve, reject) => {
    const l = parseInt(limit) || 20;
    const o = parseInt(offset) || 0;
    db.all(`SELECT * FROM theaters LIMIT ? OFFSET ?`, [l, o], (err, rows) => {
      if (err) reject(err); else resolve(rows);
    });
  });
};

const getTheaterById = (id) => {
  return new Promise((resolve, reject) => {
    db.get(`SELECT * FROM theaters WHERE id = ?`, [id], (err, row) => {
      if (err) reject(err); else resolve(row);
    });
  });
};

const getSeatsForTheater = (theaterId) => {
  return new Promise((resolve, reject) => {
    db.all(`SELECT * FROM seats WHERE theater_id = ?`, [theaterId], (err, rows) => {
      if (err) reject(err); else resolve(rows);
    });
  });
};

const updateTheater = (id, fields) => {
  const { name, location } = fields;
  const updates = [];
  const values = [];
  if (name) { updates.push('name = ?'); values.push(name); }
  if (location) { updates.push('location = ?'); values.push(location); }
  if (!updates.length) throw new Error('No fields to update');
  values.push(id);
  return new Promise((resolve, reject) => {
    db.run(`UPDATE theaters SET ${updates.join(', ')} WHERE id = ?`, values, function(err) {
      if (err) reject(err);
      else if (this.changes === 0) reject(new Error('Theater not found'));
      else resolve({ id, updated: true });
    });
  });
};

const deleteTheater = (id) => {
  return new Promise((resolve, reject) => {
    db.run(`DELETE FROM theaters WHERE id = ?`, [id], function(err) {
      if (err) reject(err);
      else if (this.changes === 0) reject(new Error('Theater not found'));
      else resolve({ id, deleted: true });
    });
  });
};

// Bulk add seats: seats is array of { seatNumber, category }
const bulkAddSeats = (theaterId, seats) => {
  return new Promise((resolve, reject) => {
    const results = [];
    const stmt = db.prepare(
      `INSERT OR IGNORE INTO seats (id, theater_id, seat_number, category) VALUES (?, ?, ?, ?)`
    );
    db.serialize(() => {
      db.run('BEGIN');
      for (const s of seats) {
        const id = uuidv4();
        const category = s.category || 'standard';
        stmt.run([id, theaterId, s.seatNumber, category], function(err) {
          if (!err) results.push({ id, theaterId, seatNumber: s.seatNumber, category });
        });
      }
      db.run('COMMIT', (err) => {
        stmt.finalize();
        if (err) reject(err); else resolve(results);
      });
    });
  });
};

module.exports = { createTheater, getTheaters, getTheaterById, getSeatsForTheater, updateTheater, deleteTheater, bulkAddSeats };
