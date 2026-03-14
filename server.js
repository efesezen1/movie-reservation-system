const express = require('express');
const swaggerUi = require('swagger-ui-express');
const swaggerJsdoc = require('swagger-jsdoc');
const db = require('./db/database');  // init DB
const logger = require('./middleware/logger');
const rateLimiter = require('./middleware/rateLimiter');

const app = express();
const PORT = 3000;

// Trust proxy for accurate req.ip (localhost/IPv6 handling)
app.set('trust proxy', true);

// Base middleware — must come before all routes so body is parsed everywhere
app.use(logger);
app.use(express.json());

// Admin route before rate limiter so signin is never blocked
app.use('/admin', require('./routes/admin'));

app.use(rateLimiter);

// Swagger setup for docs at /docs (scans routes incl /admin)
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Movie Reservation System API',
      version: '1.0.0',
      description: 'Offline backend for movie ticket app with users, theaters, movies, seat reservations, mock payments, and tickets. No internet required except mock internal. Rate limited: 7 reqs/IP/min (custom; admin JWT bypasses).',
    },
    servers: [{ url: `http://localhost:${PORT}` }],
  },
  apis: ['./routes/*.js'],  // scan routes for JSDoc
};
const swaggerDocs = swaggerJsdoc(swaggerOptions);
app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));

// Mount other routes (services)
app.use('/users', require('./routes/users'));
app.use('/theaters', require('./routes/theaters'));
app.use('/movies', require('./routes/movies'));
app.use('/seats', require('./routes/seats'));
app.use('/tickets', require('./routes/tickets'));
app.use('/payments', require('./routes/payments'));

// Root
app.get('/', (req, res) => {
  res.json({ message: 'Movie Reservation System API. Docs at /docs. Offline, SQLite, mock payment.' });
});

// Error handling
app.use((err, req, res, next) => {
  res.status(500).json({ error: err.message });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`Swagger docs: http://localhost:${PORT}/docs`);
  console.log('DB initialized at ./db/movie_reservation.db');
});

module.exports = app;  // for potential testing