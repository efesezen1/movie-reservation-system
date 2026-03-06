# Postman Collection for Movie Reservation System

Base URL: http://localhost:3000

**Setup flow (run in order, capture IDs from responses):**
1. Create user -> get id
2. Create theater -> get id
3. Add seats to theater
4. Create movie for theater -> get id
5. Reserve seat -> get reservationId
6. Issue ticket -> get ticket

## Endpoints & Payloads

### Users Service
- POST /users
  ```json
  {
    "name": "John Doe",
    "email": "john@example.com",
    "password": "pass123"
  }
  ```
  Response: { "id": "...", "name": "...", "email": "..." }

- GET /users
- GET /users/{userId}

### Theaters Service
- POST /theaters
  ```json
  {
    "name": "Cinema City",
    "location": "Downtown"
  }
  ```
- GET /theaters
- GET /theaters/{theaterId}
- GET /theaters/{theaterId}/seats

### Movies Service
- POST /movies
  ```json
  {
    "title": "Inception",
    "description": "Dream thriller",
    "duration": 148,
    "theaterId": "{theaterId}",
    "showtime": "2024-03-07 20:00"
  }
  ```
- GET /movies
- GET /movies/{movieId}
- GET /movies/theater/{theaterId}

### Seats Reservation Service (bound to res)
- POST /seats/add
  ```json
  {
    "theaterId": "{theaterId}",
    "seatNumber": "A1"
  }
  ```
- POST /seats/reserve
  ```json
  {
    "theaterId": "{theaterId}",
    "seatNumber": "A1",
    "userId": "{userId}",
    "movieId": "{movieId}"
  }
  ```
  Response: { "reservationId": "...", ... }
- GET /seats/reservations/{reservationId}

### Tickets Service (bound to seat res + mock payment)
- POST /tickets/issue
  ```json
  {
    "reservationId": "{reservationId}",
    "amount": 10.0
  }
  ```
  Response: { "ticketId": "...", "status": "issued" }
- GET /tickets/{ticketId}
- GET /tickets/user/{userId}

### Admin Service (JWT for rate bypass)
- POST /admin/signin (hardcoded admin only , offline)
  ```json
  {
    "username": "admin",
    "password": "adminpass"
  }
  ```
  Response: { "token": "eyJ...", "user": { "role": "admin" }, ... }
- Use token: Header Authorization: Bearer <token> for any endpoint (unlimited , Remaining=999999 , no 429)

## Notes
- Offline: no net calls.
- Mock payment always confirms (amount > 0).
- Rate limiter: 7 reqs per IP per min to all services/endpoints (custom, see middleware/rateLimiter.js; returns 429 if exceeded; sets headers X-RateLimit-Limit/Remaining/Reset).
- Use /docs for Swagger.
- All changes documented via Swagger JSDoc and this file.

Test by sequential POSTs, substituting IDs.