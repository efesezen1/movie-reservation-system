# 🎬 Movie Reservation System — 3-Minute Video Showcase Script

> **Format:** Postman endpoint demo · **Total Duration:** ~3 minutes
> **Tip:** Have Postman ready with a fresh collection. Base URL: `http://localhost:3000`

---

## INTRO — What Is This App? (0:00 – 0:25)

**[Show: Postman open, hit `GET /` to show the root response]**

> "Hey everyone — in this video I'm going to walk you through the **Movie Reservation System**, a fully **offline** backend API I built with **Node.js**, **Express**, and **SQLite**.
>
> This system handles the **entire lifecycle** of booking a movie ticket — from registering users and setting up theaters, all the way to reserving a seat, processing a payment, and issuing a ticket.
>
> It also includes a **custom rate limiter**, **admin authentication with JWT**, **Swagger documentation**, and a **mock payment service** — all working without any internet connection. Let me show you how it works."

---

## ACT 1 — User Registration & Theaters (0:25 – 1:00)

### Step 1 · Create a User

**[Postman: `POST /users`]**

```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "pass123"
}
```

> "First, we register a user. I send a POST to `/users` with a name, email, and password. The API returns a **UUID-based user ID** — I'll save this for later."

**[Copy the returned `id` and save it as a variable]**

### Step 2 · Create a Theater

**[Postman: `POST /theaters`]**

```json
{
  "name": "Cinema City",
  "location": "Downtown"
}
```

> "Next, I create a theater. Every movie and seat in the system is tied to a specific theater. I'll grab this **theater ID** too."

### Step 3 · Add Seats to the Theater

**[Postman: `POST /seats/add`]**

```json
{
  "theaterId": "{{theaterId}}",
  "seatNumber": "A1"
}
```

> "Now I add a seat — seat A1 — to that theater. In a real system you'd bulk-add seats, but for demo purposes one is enough."

---

## ACT 2 — Movies & Seat Reservation (1:00 – 1:40)

### Step 4 · Create a Movie

**[Postman: `POST /movies`]**

```json
{
  "title": "Inception",
  "description": "Dream thriller",
  "duration": 148,
  "theaterId": "{{theaterId}}",
  "showtime": "2024-03-07 20:00"
}
```

> "Here I create a movie — _Inception_ — assigned to our theater with a specific showtime. The API returns a **movie ID**."

### Step 5 · Reserve a Seat

**[Postman: `POST /seats/reserve`]**

```json
{
  "theaterId": "{{theaterId}}",
  "seatNumber": "A1",
  "userId": "{{userId}}",
  "movieId": "{{movieId}}"
}
```

> "Now the core action — **reserving a seat**. I pass the theater, seat number, user, and movie. The system checks availability and returns a **reservation ID**. This ties the user, movie, and seat together."

---

## ACT 3 — Payment & Ticket Issuance (1:40 – 2:10)

### Step 6 · Issue a Ticket (triggers mock payment)

**[Postman: `POST /tickets/issue`]**

```json
{
  "reservationId": "{{reservationId}}",
  "amount": 10.0
}
```

> "Finally, I issue a ticket. Behind the scenes this triggers a **mock payment service** — it automatically confirms any payment with an amount greater than zero. Once confirmed, the reservation status updates to 'confirmed' and a **ticket is issued** with a unique ticket ID.
>
> I can also verify the ticket and see all tickets for a user:"

**[Quick hits: `GET /tickets/{{ticketId}}` and `GET /tickets/user/{{userId}}`]**

> "Everything is linked — user, reservation, payment, and ticket — all through UUIDs."

---

## ACT 4 — Rate Limiting & Admin Bypass (2:10 – 2:50)

### Step 7 · Demonstrate the Rate Limiter

**[Postman: Rapidly send 8+ requests to any endpoint, e.g. `GET /users`]**

> "Now here's something cool — the API has a **custom rate limiter**. Every IP gets **7 requests per minute** across all endpoints. Watch the response headers — `X-RateLimit-Remaining` counts down with each request."

**[Show: the 8th request returns `429 Too Many Requests`]**

> "On the 8th request — boom, **429 Too Many Requests**. No third‑party library is used here, it's a fully custom in-memory implementation."

### Step 8 · Admin Sign-In & JWT Bypass

**[Postman: `POST /admin/signin`]**

```json
{
  "username": "admin",
  "password": "adminpass"
}
```

> "But what if you're an admin? I sign in with hardcoded admin credentials and get back a **JWT token**."

**[Copy token, add `Authorization: Bearer <token>` header, send requests again]**

> "Now with the Bearer token attached, I can send **unlimited requests** — the rate limiter is completely bypassed. Notice `X-RateLimit-Remaining` shows **999999**. This is great for admin tools or testing."

---

## CLOSING — Swagger & Wrap-Up (2:50 – 3:00)

**[Show: browser or Postman hitting `http://localhost:3000/docs`]**

> "And last but not least — every single endpoint is documented with **Swagger** at `/docs`. You can explore and test the full API right from the browser.
>
> So to recap: this is a **complete, offline movie reservation backend** — users, theaters, movies, seat reservations, mock payments, tickets, rate limiting, and admin JWT auth — all built with Node.js, Express, and SQLite. Thanks for watching!"

---

## Quick Reference — Endpoint Flow

| Step | Method | Endpoint           | Purpose                    |
| ---- | ------ | ------------------ | -------------------------- |
| 1    | POST   | `/users`           | Register a user            |
| 2    | POST   | `/theaters`        | Create a theater           |
| 3    | POST   | `/seats/add`       | Add a seat to the theater  |
| 4    | POST   | `/movies`          | Create a movie/showtime    |
| 5    | POST   | `/seats/reserve`   | Reserve a seat             |
| 6    | POST   | `/tickets/issue`   | Pay & issue ticket         |
| 7    | GET    | `/users` (×8)      | Trigger rate limit (429)   |
| 8    | POST   | `/admin/signin`    | Get admin JWT              |
| 9    | GET    | `/users` (+Bearer) | Prove rate limit bypass    |
| 10   | GET    | `/docs`            | Show Swagger documentation |
