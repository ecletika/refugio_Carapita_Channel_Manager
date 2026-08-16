-- ============================================================================
-- Migration: periodo de estadia completo no cupao (de X ate Y)
-- Data: 2026-08-16
-- ----------------------------------------------------------------------------
-- Complementa a migracao 20260816_cupom_data_limite_estadia.sql, que so tinha
-- adicionado o limite superior. Um cupao passa a ter tres datas:
--
--   data_validade        -> ultimo dia para FAZER a reserva       ("reservar ate")
--   data_inicio_estadia  -> primeira data de CHECK-IN abrangida   ("estadia de")
--   data_limite_estadia  -> ultima data de CHECK-IN abrangida     ("estadia ate")
--
-- Permite campanhas com janela fechada, ex.: "reserve ate 29/08, para estadias
-- de 01/11 a 15/12" (epoca baixa), sem servir para datas fora desse intervalo.
--
-- Regras (todas inclusivas):
--   data_inicio_estadia NULL -> sem limite inferior
--   data_limite_estadia NULL -> usa data_validade, para um cupao antigo nao
--                               poder ser usado para uma estadia noutro ano
--
-- Idempotente: pode ser corrida mais do que uma vez.
-- ============================================================================

ALTER TABLE public."Cupom"
  ADD COLUMN IF NOT EXISTS data_inicio_estadia timestamp without time zone;

COMMENT ON COLUMN public."Cupom".data_inicio_estadia IS 'Primeira data de check-in abrangida (estadia de, inclusive). NULL = sem limite inferior';
