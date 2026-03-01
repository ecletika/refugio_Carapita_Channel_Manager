---
name: booking_logic
description: Business logic for handling reservations, availability, and pricing.
---

# Booking & Reservation Logic

## Availability Algorithm
- Before allowing a standard user to book, ALWAYS check real-time availability.
- Consider manual blocks (bloqueios manuais) as occupied dates.
- A room is available if it has NO overlapping active bookings and NO manual blocks.

## Pricing & Tariffs
- Base pricing should scale according to the number of guests if applicable.
- Special dates (tarífas especiais / feriados) override standard weekend or weekday pricing.
- Ensure the exact number of nights is correctly calculated (Check-out Date - Check-in Date).

## Edge Cases
- Prevent booking in the past.
- Minimum and Maximum stay lengths must be respected.
- Handle timezone differences consistently (preferably store and compare in UTC, display in local).
