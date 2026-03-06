# Services Architecture Diagram (ASCII)

This shows relations based on code/DB bindings (e.g., theater_id/movie_id FKs, service calls):

```
                  +----------------+     +----------------+
                  |  Users Service |     |  Theaters Service |
                  | (register/list)|     | (create/list,   |
                  +----------------+     |  seats assoc)   |
                           |              +----------------+
                           |                       |
                           v                       v
                  +----------------+     +----------------+     +----------------+
                  |  Movies Service| <--- | Seats Res. Svc | --->|  Tickets Service|
                  | (create/list,  |      | (add/reserve,  |     | (issue via pay, |
                  |  by theater)   |      |  binds user/   |     |  list by user)  |
                  +----------------+      |  movie/seat)   |     +----------------+
                           ^              +----------------+              |
                           |                       |                      v
                           |                       |             +----------------+
                           +-----------------------+             | Mock Payment  |
                                 (shared theater/                 | Service       |
                                  movie/seat data)                | (internal mock|
                                                                  |  confirm only)|
                                                                  +----------------+

Key Relations:
- Theaters <--> Movies, Seats (FK theater_id; movies/showtimes/seats per theater)
- Movies <--> SeatsRes, Tickets (movie_id in res/ticket; tickets pull movie context)
- SeatsRes <--> Tickets (reservation_id bind; reserve -> payment -> ticket)
- Users <--> All (user_id in res/ticket)
- Offline: all internal/DB, no external calls.
- Rate Limiter (global): custom middleware (7 req/IP/min) protects all services (users/theaters/movies/seats/tickets + payment); responses include X-RateLimit-Limit/Remaining/Reset headers.
- Admin/JWT: /admin/signin (hardcoded admin/adminpass , crypto JWT); valid Bearer token bypasses rate (unlimited , role=admin in payload).

See routes/services/DB/middleware/utils for impl; /docs, postman.md for endpoints.
```

Created concisely from existing structure (no hallucination).