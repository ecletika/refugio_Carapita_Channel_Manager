-- ============================================================================
-- Migration: garantir aima_form_token em TODAS as reservas
-- Data: 2026-07-27
-- ----------------------------------------------------------------------------
-- CONTEXTO / CAUSA-RAIZ
--   O link do formulário AIMA (/aima?token=...) é construído a partir da coluna
--   "Reserva".aima_form_token. Entre 2026-05-28 e 2026-06-19 um redeploy manual
--   (não versionado) da Edge Function `reservas-criar` deixou de preencher esse
--   campo, pelo que as reservas novas passaram a ficar com aima_form_token = NULL
--   e o link deixou de ser criado automaticamente.
--
--   Esta migração tira a garantia de dentro do código volátil da Edge Function e
--   coloca-a na base de dados — o mesmo padrão já usado, de forma fiável, pela
--   coluna numero_reserva (DEFAULT public.gerar_numero_reserva()).
--
-- PORQUÊ UM TRIGGER (e não apenas um DEFAULT na coluna)
--   Não é possível confirmar se a versão atual da `reservas-criar` OMITE o campo
--   ou envia `null` explícito. Um DEFAULT só se aplica quando a coluna é omitida;
--   um `null` explícito ignora-o. Um trigger BEFORE INSERT cobre os DOIS casos e
--   NUNCA rejeita o insert (apenas preenche quando vem vazio), pelo que não há
--   forma de partir a criação de reservas.
--
-- SEGURANÇA
--   - Idempotente: pode ser corrida mais do que uma vez.
--   - O backfill só toca em linhas com token NULL/vazio; tokens já existentes
--     (e portanto links já enviados) ficam intactos.
--   - gen_random_uuid() é nativo no PostgreSQL 17 — não requer extensões.
-- ============================================================================

-- 1) Função geradora do token ------------------------------------------------
CREATE OR REPLACE FUNCTION public.set_aima_form_token()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.aima_form_token IS NULL OR NEW.aima_form_token = '' THEN
    NEW.aima_form_token :=
      replace(gen_random_uuid()::text, '-', '') ||
      replace(gen_random_uuid()::text, '-', '');
  END IF;
  RETURN NEW;
END;
$$;

-- 2) Trigger BEFORE INSERT ---------------------------------------------------
--    Preenche o token em qualquer insert sem token (omitido OU null explícito).
DROP TRIGGER IF EXISTS trg_set_aima_form_token ON public."Reserva";
CREATE TRIGGER trg_set_aima_form_token
BEFORE INSERT ON public."Reserva"
FOR EACH ROW
EXECUTE FUNCTION public.set_aima_form_token();

-- 3) Backfill das reservas existentes sem token ------------------------------
--    Apenas linhas NULL/vazias. Não altera tokens já atribuídos.
UPDATE public."Reserva"
SET aima_form_token =
      replace(gen_random_uuid()::text, '-', '') ||
      replace(gen_random_uuid()::text, '-', '')
WHERE aima_form_token IS NULL OR aima_form_token = '';


-- ============================================================================
-- ENDURECIMENTO OPCIONAL (descomentar para aplicar)
-- ----------------------------------------------------------------------------
-- Correr SÓ depois de confirmar que as reservas novas já vêm com token.
-- Devem ser executados DEPOIS dos passos 1-3 (o backfill remove os NULLs
-- existentes e o trigger garante que inserts futuros passam a validação).
--
--   -- Torna impossível existir uma reserva sem token:
--   ALTER TABLE public."Reserva" ALTER COLUMN aima_form_token SET NOT NULL;
--
--   -- Garante unicidade do token (é a chave de lookup do formulário público):
--   CREATE UNIQUE INDEX IF NOT EXISTS reserva_aima_form_token_key
--     ON public."Reserva" (aima_form_token);
-- ============================================================================
