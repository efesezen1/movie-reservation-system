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

const getMovies = (limit, offset) => {
  return new Promise((resolve, reject) => {
    const l = parseInt(limit) || 20;
    const o = parseInt(offset) || 0;
    db.all(`SELECT * FROM movies LIMIT ? OFFSET ?`, [l, o], (err, rows) => {
      if (err) reject(err); else resolve(rows);
    });
  });
};

const getMovieById = (id) => {
  return new Promise((resolve, reject) => {
    db.get(`SELECT * FROM movies WHERE id = ?`, [id], (err, row) => {
      if (err) reject(err); else resolve(row);
    });
  });
};

const getMoviesByTheater = (theaterId) => {
  return new Promise((resolve, reject) => {
    db.all(`SELECT * FROM movies WHERE theater_id = ?`, [theaterId], (err, rows) => {
      if (err) reject(err); else resolve(rows);
    });
  });
};

const searchMovies = (query, filters = {}) => {
  return new Promise((resolve, reject) => {
    let sql = `SELECT * FROM movies WHERE 1=1`;
    const params = [];
    if (query) { sql += ` AND title LIKE ?`; params.push(`%${query}%`); }
    if (filters.showtime) { sql += ` AND showtime LIKE ?`; params.push(`%${filters.showtime}%`); }
    if (filters.minDuration) { sql += ` AND duration >= ?`; params.push(parseInt(filters.minDuration)); }
    if (filters.maxDuration) { sql += ` AND duration <= ?`; params.push(parseInt(filters.maxDuration)); }
    if (filters.theaterId) { sql += ` AND theater_id = ?`; params.push(filters.theaterId); }
    db.all(sql, params, (err, rows) => {
      if (err) reject(err); else resolve(rows);
    });
  });
};

const updateMovie = (id, fields) => {
  const { title, description, duration, theaterId, showtime } = fields;
  const updates = [];
  const values = [];
  if (title) { updates.push('title = ?'); values.push(title); }
  if (description !== undefined) { updates.push('description = ?'); values.push(description); }
  if (duration) { updates.push('duration = ?'); values.push(duration); }
  if (theaterId) { updates.push('theater_id = ?'); values.push(theaterId); }
  if (showtime) { updates.push('showtime = ?'); values.push(showtime); }
  if (!updates.length) throw new Error('No fields to update');
  values.push(id);
  return new Promise((resolve, reject) => {
    db.run(`UPDATE movies SET ${updates.join(', ')} WHERE id = ?`, values, function(err) {
      if (err) reject(err);
      else if (this.changes === 0) reject(new Error('Movie not found'));
      else resolve({ id, updated: true });
    });
  });
};

const deleteMovie = (id) => {
  return new Promise((resolve, reject) => {
    db.run(`DELETE FROM movies WHERE id = ?`, [id], function(err) {
      if (err) reject(err);
      else if (this.changes === 0) reject(new Error('Movie not found'));
      else resolve({ id, deleted: true });
    });
  });
};

module.exports = { createMovie, getMovies, getMovieById, getMoviesByTheater, searchMovies, updateMovie, deleteMovie };
