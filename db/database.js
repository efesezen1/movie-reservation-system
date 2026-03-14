const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./db/movie_reservation.db');

// Create tables
db.serialize(() => {
  // Users table
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL
  )`);

  // Theaters table
  db.run(`CREATE TABLE IF NOT EXISTS theaters (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    location TEXT NOT NULL
  )`);

  // Movies table
  db.run(`CREATE TABLE IF NOT EXISTS movies (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    duration INTEGER NOT NULL,  -- in minutes
    theater_id TEXT,
    showtime TEXT NOT NULL,
    FOREIGN KEY (theater_id) REFERENCES theaters(id)
  )`);

  // Seats table
  db.run(`CREATE TABLE IF NOT EXISTS seats (
    id TEXT PRIMARY KEY,
    theater_id TEXT NOT NULL,
    seat_number TEXT NOT NULL,
    is_reserved BOOLEAN DEFAULT 0,
    FOREIGN KEY (theater_id) REFERENCES theaters(id),
    UNIQUE(theater_id, seat_number)
  )`);

  // Reservations table
  db.run(`CREATE TABLE IF NOT EXISTS reservations (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    movie_id TEXT NOT NULL,
    seat_id TEXT NOT NULL,
    status TEXT DEFAULT 'pending',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (movie_id) REFERENCES movies(id),
    FOREIGN KEY (seat_id) REFERENCES seats(id)
  )`);

  // Mock Payments table
  db.run(`CREATE TABLE IF NOT EXISTS payments (
    id TEXT PRIMARY KEY,
    reservation_id TEXT NOT NULL,
    amount REAL NOT NULL,
    status TEXT DEFAULT 'pending',  -- mock: pending, confirmed, failed
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (reservation_id) REFERENCES reservations(id)
  )`);

  // Tickets table (bound to reservation and payment)
  db.run(`CREATE TABLE IF NOT EXISTS tickets (
    id TEXT PRIMARY KEY,
    reservation_id TEXT NOT NULL,
    payment_id TEXT NOT NULL,
    issued_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (reservation_id) REFERENCES reservations(id),
    FOREIGN KEY (payment_id) REFERENCES payments(id)
  )`);

  // Schema migrations: add new columns (ignored if already exist)
  db.run(`ALTER TABLE users ADD COLUMN role TEXT DEFAULT 'user'`, () => {});
  db.run(`ALTER TABLE seats ADD COLUMN category TEXT DEFAULT 'standard'`, () => {});
  db.run(`ALTER TABLE tickets ADD COLUMN status TEXT DEFAULT 'active'`, () => {});
  db.run(`ALTER TABLE tickets ADD COLUMN token TEXT`, () => {});
  db.run(`ALTER TABLE payments ADD COLUMN refunded INTEGER DEFAULT 0`, () => {});

  // Seed mock data for showcasing (theaters, movies with varying showtimes for dynamic pricing, seats)
  // INSERT OR IGNORE for idempotency , enables demo flows without duplicates
  const theaterId = 'mock-theater-1';
  db.run(`INSERT OR IGNORE INTO theaters (id, name, location) VALUES (?, ?, ?)`, [theaterId, 'Mock Cinema City', 'Downtown']);

  // Seats (5 for demo)
  for (let i = 1; i <= 5; i++) {
    const seatId = `mock-seat-${i}`;
    db.run(`INSERT OR IGNORE INTO seats (id, theater_id, seat_number) VALUES (?, ?, ?)`, [seatId, theaterId, `A${i}`]);
  }

  // Movies with different showtimes (morning cheap , afternoon mid , prime high for pricing demo)
  db.run(`INSERT OR IGNORE INTO movies (id, title, description, duration, theater_id, showtime) VALUES (?, ?, ?, ?, ?, ?)`, 
    ['mock-movie-morning', 'Morning Show', 'Family comedy', 120, theaterId, '2026-03-07 09:00']);
  db.run(`INSERT OR IGNORE INTO movies (id, title, description, duration, theater_id, showtime) VALUES (?, ?, ?, ?, ?, ?)`, 
    ['mock-movie-afternoon', 'Afternoon Drama', 'Emotional story', 135, theaterId, '2026-03-07 14:00']);
  db.run(`INSERT OR IGNORE INTO movies (id, title, description, duration, theater_id, showtime) VALUES (?, ?, ?, ?, ?, ?)`, 
    ['mock-movie-prime', 'Prime Time Thriller', 'Action blockbuster', 150, theaterId, '2026-03-07 20:00']);
});

console.log('DB seeded with mock movies/theaters/seats for showcasing (morning/prime pricing demo)');

module.exports = db;