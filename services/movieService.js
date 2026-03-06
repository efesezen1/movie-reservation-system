const db = require('../db/database');
const { v4: uuidv4 } = require('uuid');

// Movie Service
const createMovie = (title, description, duration, theaterId, showtime) => {
  return new Promise((resolve, reject) => {
    const id = uuidv4();
    db.run(`INSERT INTO movies (id, title, description, duration, theater_id, showtime) VALUES (?, ?, ?, ?, ?, ?)`, 
      [id, title, description, duration, theaterId, showtime], function(err) {
      if (err) reject(err);
      else resolve({ id, title, description, duration, theaterId, showtime });
    });
  });
};

const getMovies = () => {
  return new Promise((resolve, reject) => {
    db.all(`SELECT * FROM movies`, [], (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
};

const getMovieById = (id) => {
  return new Promise((resolve, reject) => {
    db.get(`SELECT * FROM movies WHERE id = ?`, [id], (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
};

const getMoviesByTheater = (theaterId) => {
  return new Promise((resolve, reject) => {
    db.all(`SELECT * FROM movies WHERE theater_id = ?`, [theaterId], (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
};

module.exports = { createMovie, getMovies, getMovieById, getMoviesByTheater };