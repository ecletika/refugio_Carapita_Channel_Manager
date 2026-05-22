-- Refugio Carapita - AIMA form token fields for reservations
-- Execute in Supabase SQL Editor.

ALTER TABLE "Reserva"
    ADD COLUMN IF NOT EXISTS "aima_form_token" TEXT,
    ADD COLUMN IF NOT EXISTS "aima_dados_completos" BOOLEAN DEFAULT false;

CREATE UNIQUE INDEX IF NOT EXISTS idx_reserva_aima_form_token
    ON "Reserva" ("aima_form_token")
    WHERE "aima_form_token" IS NOT NULL;

UPDATE "Reserva"
SET "aima_form_token" = replace(gen_random_uuid()::text, '-', '')
WHERE "aima_form_token" IS NULL;

SELECT
    id,
    aima_form_token,
    aima_dados_completos
FROM "Reserva"
ORDER BY criado_em DESC
LIMIT 20;
