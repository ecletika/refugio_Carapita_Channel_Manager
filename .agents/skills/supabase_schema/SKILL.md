---
name: supabase_schema
description: Database schema, tables and best practices for Supabase SDK integration
---

# Supabase Data Access Guidelines

## Core Tables (Expected Structure)
- `Rooms`: Contains room details, capacity, base prices, photos.
- `Bookings`: Contains reservation data, check-in, check-out, status, total price, user reference.
- `Tours (Passeios)`: Tour details, images, descriptions.
- `ManualBlocks (Bloqueios Manuais)`: Admin table to block dates for maintenance or offline reservations.
- `SpecialTariffs`: Price overrides for specific dates/holidays.

## Integration Rules
- Use Supabase JS SDK (`@supabase/supabase-js`) for all queries. No Prisma.
- Apply Row Level Security (RLS) rules whenever writing backend functions.
- Handle file uploads (photos/videos of rooms and tours) via Supabase Storage buckets.
- Always check for database errors in the response (`const { data, error } = await supabase...`). Do not assume success.
