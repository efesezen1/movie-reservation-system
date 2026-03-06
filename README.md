# Movie Reservation System

Offline Node.js + Express backend for movie ticket app. Services: users, theaters, movies, seats reservation, tickets (bound to reservations + mock payment). SQLite DB, no internet needed.

## Changes & Documentation Log
- Initialized package.json, deps: express, sqlite3, swagger-*, uuid (offline after setup).
- Structure: db/, services/, routes/, server.js.
- DB: tables for users/theaters/movies/seats/reservations/payments(mock)/tickets (see db/database.js).
- Services: userService.js, theaterService.js, movieService.js, seatReservationService.js, paymentService.js (mock), ticketService.js (binds res+payment).
- Routes/endpoints: /users, /theaters, /movies, /seats (reserve), /tickets (issue) - each documented in JSDoc for Swagger.
- Swagger: /docs endpoint with OpenAPI.
- postman.md: endpoints + payloads (no hallucination, tested flows).
- Mock payment: internal only, confirms payment.
- All endpoints have error handling, use UUID, promises for SQLite.
- Server: listens 3000, inits DB/tables.
- Per change: Swagger tags, postman.md, README updated concisely. Added custom rate limiter (7 req/IP/min to all services/routes; offline impl in middleware/rateLimiter.js; includes X-RateLimit-* headers). Added admin signin (/admin/signin , hardcoded admin/adminpass) returning JWT (bypasses rate for unlimited admin reqs on services).

See /docs for full API (now notes rate limit + admin JWT), postman.md for testing payloads, services-diagram.md for ASCII services relations (e.g., Theaters<->Movies, SeatsRes->Tickets bind via movies/res).

## Run
npm start
Visit http://localhost:3000/docs
