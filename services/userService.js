const db = require('../db/database');
const { v4: uuidv4 } = require('uuid');

// User Service
const createUser = (name, email, password) => {
  return new Promise((resolve, reject) => {
    const id = uuidv4();
    db.run(`INSERT INTO users (id, name, email, password) VALUES (?, ?, ?, ?)`, [id, name, email, password], function(err) {
      if (err) reject(err);
      else resolve({ id, name, email });
    });
  });
};

const getUsers = () => {
  return new Promise((resolve, reject) => {
    db.all(`SELECT id, name, email FROM users`, [], (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
};

const getUserById = (id) => {
  return new Promise((resolve, reject) => {
    db.get(`SELECT id, name, email FROM users WHERE id = ?`, [id], (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
};

// For admin signin: get by email + password check (simple, no hash for offline)
const getUserByEmailAndPassword = (email, password) => {
  return new Promise((resolve, reject) => {
    db.get(`SELECT id, name, email FROM users WHERE email = ? AND password = ?`, [email, password], (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
};

module.exports = { createUser, getUsers, getUserById, getUserByEmailAndPassword };