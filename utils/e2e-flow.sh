#!/usr/bin/env bash
# End-to-end flow: admin signin → theater → movie → seats → user register → user signin
#                  → reserve seat → issue ticket → check ticket → cancel ticket → refund
#
# Requires: curl, jq
# Usage: bash utils/e2e-flow.sh

set -e
BASE="http://localhost:3000"
TS=$(date +%s)  # unique suffix per run
DIVIDER="──────────────────────────────────────────"

ok()  { echo -e "\033[32m✔ $1\033[0m"; }
err() { echo -e "\033[31m✘ $1\033[0m"; exit 1; }
hdr() { echo -e "\n\033[1m$DIVIDER\n  $1\n$DIVIDER\033[0m"; }

# ── Helper: POST and extract field ──────────────────────────────────────────
post() {
  local url="$1" data="$2" field="$3"
  local resp
  resp=$(curl -s -X POST "$BASE$url" \
    -H "Content-Type: application/json" \
    -H "${AUTH_HEADER:-}" \
    -d "$data")
  echo "$resp" | jq .
  if [ -n "$field" ]; then
    echo "$resp" | jq -r "$field"
  fi
}

get() {
  local url="$1"
  curl -s -X GET "$BASE$url" -H "${AUTH_HEADER:-}" | jq .
}

# ── 1. Admin signin ──────────────────────────────────────────────────────────
hdr "1. Admin Sign In"
ADMIN_RESP=$(curl -s -X POST "$BASE/admin/signin" \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"adminpass"}')
echo "$ADMIN_RESP" | jq .
ADMIN_TOKEN=$(echo "$ADMIN_RESP" | jq -r '.token')
[ "$ADMIN_TOKEN" != "null" ] && ok "Admin JWT obtained" || err "Admin signin failed"
# Use admin JWT globally so all requests bypass rate limiting during this demo
AUTH_HEADER="Authorization: Bearer $ADMIN_TOKEN"

# ── 2. Create theater ────────────────────────────────────────────────────────
hdr "2. Create Theater"
THEATER_RESP=$(curl -s -X POST "$BASE/theaters" \
  -H "Content-Type: application/json" \
  -H "$AUTH_HEADER" \
  -d '{"name":"Grand Cineplex","location":"City Center"}')
echo "$THEATER_RESP" | jq .
THEATER_ID=$(echo "$THEATER_RESP" | jq -r '.id')
[ "$THEATER_ID" != "null" ] && ok "Theater created: $THEATER_ID" || err "Theater creation failed"

# ── 3. Bulk add seats ────────────────────────────────────────────────────────
hdr "3. Bulk Add Seats to Theater"
SEATS_RESP=$(curl -s -X POST "$BASE/theaters/$THEATER_ID/seats/bulk" \
  -H "Content-Type: application/json" \
  -H "$AUTH_HEADER" \
  -d '{
    "seats": [
      {"seatNumber":"A1","category":"standard"},
      {"seatNumber":"A2","category":"vip"},
      {"seatNumber":"A3","category":"accessible"}
    ]
  }')
echo "$SEATS_RESP" | jq .
ok "Seats added to theater"

# ── 4. Create movie ──────────────────────────────────────────────────────────
hdr "4. Create Movie"
MOVIE_RESP=$(curl -s -X POST "$BASE/movies" \
  -H "Content-Type: application/json" \
  -H "$AUTH_HEADER" \
  -d "{\"title\":\"Inception\",\"description\":\"A mind-bending thriller\",\"duration\":148,\"theaterId\":\"$THEATER_ID\",\"showtime\":\"2026-04-01 20:00\"}")
echo "$MOVIE_RESP" | jq .
MOVIE_ID=$(echo "$MOVIE_RESP" | jq -r '.id')
[ "$MOVIE_ID" != "null" ] && ok "Movie created: $MOVIE_ID" || err "Movie creation failed"

# ── 5. Search movies ─────────────────────────────────────────────────────────
hdr "5. Search Movies (q=Inception)"
curl -s -H "$AUTH_HEADER" "$BASE/movies/search?q=Inception" | jq .
ok "Search returned results"

# ── 6. Register user ─────────────────────────────────────────────────────────
hdr "6. Register User"
USER_RESP=$(curl -s -X POST "$BASE/users" \
  -H "Content-Type: application/json" \
  -H "$AUTH_HEADER" \
  -d "{\"name\":\"Alice\",\"email\":\"alice_${TS}@example.com\",\"password\":\"secret123\"}")
echo "$USER_RESP" | jq .
USER_ID=$(echo "$USER_RESP" | jq -r '.id')
[ "$USER_ID" != "null" ] && ok "User registered: $USER_ID" || err "User registration failed"

# ── 7. User signin ───────────────────────────────────────────────────────────
hdr "7. User Sign In"
USER_AUTH_RESP=$(curl -s -X POST "$BASE/users/signin" \
  -H "Content-Type: application/json" \
  -H "$AUTH_HEADER" \
  -d "{\"email\":\"alice_${TS}@example.com\",\"password\":\"secret123\"}")
echo "$USER_AUTH_RESP" | jq .
USER_TOKEN=$(echo "$USER_AUTH_RESP" | jq -r '.token')
[ "$USER_TOKEN" != "null" ] && ok "User JWT obtained" || err "User signin failed"

# ── 8. Reserve seat ──────────────────────────────────────────────────────────
hdr "8. Reserve Seat A1"
RESERVE_RESP=$(curl -s -X POST "$BASE/seats/reserve" \
  -H "Content-Type: application/json" \
  -H "$AUTH_HEADER" \
  -d "{\"theaterId\":\"$THEATER_ID\",\"seatNumber\":\"A1\",\"userId\":\"$USER_ID\",\"movieId\":\"$MOVIE_ID\"}")
echo "$RESERVE_RESP" | jq .
RESERVATION_ID=$(echo "$RESERVE_RESP" | jq -r '.reservationId')
[ "$RESERVATION_ID" != "null" ] && ok "Seat reserved: $RESERVATION_ID" || err "Seat reservation failed"

# ── 9. Issue ticket ──────────────────────────────────────────────────────────
hdr "9. Issue Ticket (mock payment)"
TICKET_RESP=$(curl -s -X POST "$BASE/tickets/issue" \
  -H "Content-Type: application/json" \
  -H "$AUTH_HEADER" \
  -d "{\"reservationId\":\"$RESERVATION_ID\",\"amount\":15.00}")
echo "$TICKET_RESP" | jq .
TICKET_ID=$(echo "$TICKET_RESP" | jq -r '.ticketId')
PAYMENT_ID=$(echo "$TICKET_RESP" | jq -r '.paymentId')
[ "$TICKET_ID" != "null" ] && ok "Ticket issued: $TICKET_ID (token embedded)" || err "Ticket issuance failed"

# ── 10. Get ticket by id ─────────────────────────────────────────────────────
hdr "10. Get Ticket by ID"
curl -s -H "$AUTH_HEADER" "$BASE/tickets/$TICKET_ID" | jq .
ok "Ticket fetched"

# ── 11. Get tickets by user ──────────────────────────────────────────────────
hdr "11. Get Tickets by User"
curl -s -H "$AUTH_HEADER" "$BASE/tickets/user/$USER_ID?limit=10&offset=0" | jq .
ok "User tickets fetched"

# ── 12. Get payment history ──────────────────────────────────────────────────
hdr "12. Payment History for User"
curl -s -H "$AUTH_HEADER" "$BASE/payments/user/$USER_ID" | jq .
ok "Payment history fetched"

# ── 13. Mark ticket as used ──────────────────────────────────────────────────
hdr "13. Update Ticket Status → used"
curl -s -X PATCH "$BASE/tickets/$TICKET_ID/status" \
  -H "Content-Type: application/json" \
  -H "$AUTH_HEADER" \
  -d '{"status":"used"}' | jq .
ok "Ticket marked as used"

# ── 14. Reserve seat A2, then cancel reservation ─────────────────────────────
hdr "14. Reserve Seat A2 then Cancel"
RESERVE2_RESP=$(curl -s -X POST "$BASE/seats/reserve" \
  -H "Content-Type: application/json" \
  -H "$AUTH_HEADER" \
  -d "{\"theaterId\":\"$THEATER_ID\",\"seatNumber\":\"A2\",\"userId\":\"$USER_ID\",\"movieId\":\"$MOVIE_ID\"}")
echo "$RESERVE2_RESP" | jq .
RESERVATION2_ID=$(echo "$RESERVE2_RESP" | jq -r '.reservationId')
curl -s -X DELETE -H "$AUTH_HEADER" "$BASE/seats/reservations/$RESERVATION2_ID" | jq .
ok "Reservation cancelled, seat A2 released"

# ── 15. Issue ticket for A3, then cancel it (triggers refund) ────────────────
hdr "15. Reserve A3 → Issue Ticket → Cancel Ticket (triggers refund)"
RESERVE3_RESP=$(curl -s -X POST "$BASE/seats/reserve" \
  -H "Content-Type: application/json" \
  -H "$AUTH_HEADER" \
  -d "{\"theaterId\":\"$THEATER_ID\",\"seatNumber\":\"A3\",\"userId\":\"$USER_ID\",\"movieId\":\"$MOVIE_ID\"}")
RESERVATION3_ID=$(echo "$RESERVE3_RESP" | jq -r '.reservationId')
TICKET3_RESP=$(curl -s -X POST "$BASE/tickets/issue" \
  -H "Content-Type: application/json" \
  -H "$AUTH_HEADER" \
  -d "{\"reservationId\":\"$RESERVATION3_ID\",\"amount\":20.00}")
echo "$TICKET3_RESP" | jq .
TICKET3_ID=$(echo "$TICKET3_RESP" | jq -r '.ticketId')
CANCEL_RESP=$(curl -s -X DELETE -H "$AUTH_HEADER" "$BASE/tickets/$TICKET3_ID")
echo "$CANCEL_RESP" | jq .
ok "Ticket cancelled and refund processed"

# ── 16. Update movie ─────────────────────────────────────────────────────────
hdr "16. Update Movie (admin)"
curl -s -X PUT "$BASE/movies/$MOVIE_ID" \
  -H "Content-Type: application/json" \
  -H "$AUTH_HEADER" \
  -d '{"showtime":"2026-04-01 21:30","description":"Updated: A mind-bending thriller"}' | jq .
ok "Movie updated"

# ── 17. Update theater ───────────────────────────────────────────────────────
hdr "17. Update Theater (admin)"
curl -s -X PUT "$BASE/theaters/$THEATER_ID" \
  -H "Content-Type: application/json" \
  -H "$AUTH_HEADER" \
  -d '{"name":"Grand Cineplex Premium"}' | jq .
ok "Theater updated"

# ── Done ─────────────────────────────────────────────────────────────────────
hdr "All steps completed successfully"
echo -e "\033[1mIDs used in this run:\033[0m"
echo "  Theater:     $THEATER_ID"
echo "  Movie:       $MOVIE_ID"
echo "  User:        $USER_ID"
echo "  Reservation: $RESERVATION_ID"
echo "  Ticket:      $TICKET_ID"
echo "  Payment:     $PAYMENT_ID"
