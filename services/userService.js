const db = require('../db/database');
const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcryptjs');

const SALT_ROUNDS = 10;

// User Service
const createUser = async (name, email, password, role = 'user') => {
  const id = uuidv4();
  const hashed = await bcrypt.hash(password, SALT_ROUNDS);
  return new Promise((resolve, reject) => {
    db.run(`INSERT INTO users (id, name, email, password, role) VALUES (?, ?, ?, ?, ?)`,
      [id, name, email, hashed, role], function(err) {
      if (err) reject(err);
      else resolve({ id, name, email, role });
    });
  });
};

const loginUser = async (email, password) => {
  const row = await new Promise((resolve, reject) => {
    db.get(`SELECT * FROM users WHERE email = ?`, [email], (err, row) => {
      if (err) reject(err); else resolve(row);
    });
  });
  if (!row) return null;
  const match = await bcrypt.compare(password, row.password);
  if (!match) return null;
  return { id: row.id, name: row.name, email: row.email, role: row.role };
};

const getUsers = (limit, offset) => {
  return new Promise((resolve, reject) => {
    const l = parseInt(limit) || 20;
    const o = parseInt(offset) || 0;
    db.all(`SELECT id, name, email, role FROM users LIMIT ? OFFSET ?`, [l, o], (err, rows) => {
      if (err) reject(err); else resolve(rows);
    });
  });
};

const getUserById = (id) => {
  return new Promise((resolve, reject) => {
    db.get(`SELECT id, name, email, role FROM users WHERE id = ?`, [id], (err, row) => {
      if (err) reject(err); else resolve(row);
    });
  });
};

const updateUser = async (id, fields) => {
  const { name, email, password } = fields;
  const updates = [];
  const values = [];
  if (name) { updates.push('name = ?'); values.push(name); }
  if (email) { updates.push('email = ?'); values.push(email); }
  if (password) {
    const hashed = await bcrypt.hash(password, SALT_ROUNDS);
    updates.push('password = ?'); values.push(hashed);
  }
  if (!updates.length) throw new Error('No fields to update');
  values.push(id);
  return new Promise((resolve, reject) => {
    db.run(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`, values, function(err) {
      if (err) reject(err);
      else if (this.changes === 0) reject(new Error('User not found'));
      else resolve({ id, updated: true });
    });
  });
};

const deleteUser = (id) => {
  return new Promise((resolve, reject) => {
    db.run(`DELETE FROM users WHERE id = ?`, [id], function(err) {
      if (err) reject(err);
      else if (this.changes === 0) reject(new Error('User not found'));
      else resolve({ id, deleted: true });
    });
  });
};

// Legacy: plaintext check (kept for backward compat, use loginUser for new flows)
const getUserByEmailAndPassword = (email, password) => {
  return new Promise((resolve, reject) => {
    db.get(`SELECT id, name, email FROM users WHERE email = ? AND password = ?`, [email, password], (err, row) => {
      if (err) reject(err); else resolve(row);
    });
  });
};

module.exports = { createUser, loginUser, getUsers, getUserById, updateUser, deleteUser, getUserByEmailAndPassword };
