-- Refugio Carapita - AIMA form token fields for reservations
-- Execute in Supabase SQL Editor.

ALTER TABLE "Reserva"
    ADD COLUMN IF NOT EXISTS "aima_form_token" TEXT,
    ADD COLUMN IF NOT EXISTS "aima_dados_completos" BOOLEAN DEFAULT false;

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE UNIQUE INDEX IF NOT EXISTS idx_reserva_aima_form_token
    ON "Reserva" ("aima_form_token")
    WHERE "aima_form_token" IS NOT NULL;

UPDATE "Reserva"
SET "aima_form_token" = replace(gen_random_uuid()::text, '-', '')
WHERE "aima_form_token" IS NULL;

CREATE OR REPLACE FUNCTION public.set_reserva_aima_form_token()
RETURNS trigger AS $$
BEGIN
    IF NEW.aima_form_token IS NULL OR NEW.aima_form_token = '' THEN
        NEW.aima_form_token := replace(gen_random_uuid()::text, '-', '') || replace(gen_random_uuid()::text, '-', '');
    END IF;

    IF NEW.aima_dados_completos IS NULL THEN
        NEW.aima_dados_completos := false;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_set_reserva_aima_form_token ON "Reserva";

CREATE TRIGGER trg_set_reserva_aima_form_token
BEFORE INSERT ON "Reserva"
FOR EACH ROW
EXECUTE FUNCTION public.set_reserva_aima_form_token();

SELECT
    id,
    aima_form_token,
    aima_dados_completos
FROM "Reserva"
ORDER BY criado_em DESC
LIMIT 20;
