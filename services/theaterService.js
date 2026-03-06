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

const getTheaters = () => {
  return new Promise((resolve, reject) => {
    db.all(`SELECT * FROM theaters`, [], (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
};

const getTheaterById = (id) => {
  return new Promise((resolve, reject) => {
    db.get(`SELECT * FROM theaters WHERE id = ?`, [id], (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
};

const getSeatsForTheater = (theaterId) => {
  return new Promise((resolve, reject) => {
    db.all(`SELECT * FROM seats WHERE theater_id = ?`, [theaterId], (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
};

module.exports = { createTheater, getTheaters, getTheaterById, getSeatsForTheater };