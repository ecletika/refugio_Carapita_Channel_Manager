-- ============================================================================
-- Migration: separar os dois prazos de um cupao
-- Data: 2026-08-16
-- ----------------------------------------------------------------------------
-- Ate aqui o Cupom tinha um unico campo de data (`data_validade`), interpretado
-- como "prazo para fazer a reserva". Isso permitia que um hospede reservasse hoje,
-- com o cupao ainda valido, uma estadia em outubro ou no ano seguinte e levasse o
-- desconto (caso real: RC-2026-0048 usou um cupao valido ate 29/08, a 16/08, para
-- uma estadia de 06-10/10).
--
-- Passam a existir dois prazos independentes:
--   data_validade        -> ultimo dia para FAZER a reserva      ("reservar ate")
--   data_limite_estadia  -> ultima data de CHECK-IN abrangida    ("estadia ate")
--
-- Isto permite campanhas do tipo "reserve em agosto, viaje ate dezembro".
--
-- COMPATIBILIDADE: se `data_limite_estadia` for NULL, o codigo usa `data_validade`
-- como limite da estadia. Assim os cupoes ja existentes ficam automaticamente
-- protegidos contra utilizacao para estadias de outro ano, sem precisarem de ser
-- editados um a um.
--
-- Ambos os prazos sao INCLUSIVOS e avaliados em hora de Portugal (Europe/Lisbon):
-- "reservar ate 29/08" = pode reservar durante todo o dia 29, expira as 00:00 do
-- dia 30, hora local (nao UTC).
--
-- Idempotente: pode ser corrida mais do que uma vez.
-- ============================================================================

ALTER TABLE public."Cupom"
  ADD COLUMN IF NOT EXISTS data_limite_estadia timestamp without time zone;

COMMENT ON COLUMN public."Cupom".data_validade IS 'Prazo para efetuar a reserva (reservar ate, inclusive)';
COMMENT ON COLUMN public."Cupom".data_limite_estadia IS 'Ultima data de check-in abrangida (estadia ate, inclusive). NULL = usa data_validade';
