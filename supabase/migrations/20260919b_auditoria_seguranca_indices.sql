-- ============================================================================
-- Migration: resultados da auditoria de 19/09/2026 (seguranca e desempenho)
-- ----------------------------------------------------------------------------
-- Correcoes apontadas pelo linter da base de dados durante a auditoria que se
-- seguiu ao incidente do iCal.
-- ============================================================================

-- 1) search_path fixo nas funcoes do projecto ---------------------------------
--    Uma funcao sem search_path fixo resolve os nomes das tabelas pelo
--    search_path de quem a chama. Quem controlar essa definicao pode fazer a
--    funcao ler ou escrever em objectos falsos.
ALTER FUNCTION public.gerar_numero_reserva()       SET search_path = public, pg_temp;
ALTER FUNCTION public.set_aima_form_token()        SET search_path = public, pg_temp;
ALTER FUNCTION public.impedir_reserva_sobreposta() SET search_path = public, pg_temp;


-- 2) rls_auto_enable() deixa de estar exposta na API REST ---------------------
--    E uma funcao de event trigger (corre sozinha quando se cria uma tabela),
--    mas estava executavel por `anon` e `authenticated` atraves de
--    /rest/v1/rpc/rls_auto_enable. Nao ha motivo para ser chamavel de fora.
REVOKE EXECUTE ON FUNCTION public.rls_auto_enable() FROM PUBLIC, anon, authenticated;


-- 3) Indices no caminho critico da disponibilidade ----------------------------
--    O calendario do site e o novo trigger anti-overbooking consultam Reserva
--    por quarto + datas a cada pedido. As chaves estrangeiras de Reserva nao
--    tinham indice nenhum: cada verificacao era um scan a tabela inteira.
CREATE INDEX IF NOT EXISTS reserva_quarto_datas_idx
  ON public."Reserva" (quarto_id, data_check_in, data_check_out);

CREATE INDEX IF NOT EXISTS reserva_canal_idx   ON public."Reserva" (canal_id);
CREATE INDEX IF NOT EXISTS reserva_hospede_idx ON public."Reserva" (hospede_id);

CREATE INDEX IF NOT EXISTS bloqueio_quarto_datas_idx
  ON public."Bloqueio" (quarto_id, data_inicio, data_fim);

CREATE INDEX IF NOT EXISTS tarifa_sazonal_quarto_idx
  ON public."TarifaSazonal" (quarto_id, data_inicio, data_fim);

--    Redundante: o indice unico parcial reserva_ical_uid_key (criado na
--    migracao 20260919_ical_integridade.sql) ja serve as consultas por ical_uid.
DROP INDEX IF EXISTS public.idx_reserva_ical_uid;


-- ============================================================================
-- NAO CORRIGIDO DE PROPOSITO (fica registado)
-- ----------------------------------------------------------------------------
-- * "RLS enabled, no policy" em Configuracao, SyncLog, instagram_cache e
--   instagram_token_log: e o comportamento pretendido. RLS ligado sem policies
--   significa que so a service_role (as edge functions) toca nestas tabelas —
--   nenhum cliente anonimo ou autenticado lhes chega. Nivel INFO no linter.
--
-- * "Leaked password protection disabled" (Supabase Auth): este projecto nao
--   usa o Supabase Auth para os hospedes (usa senha_hash na tabela Hospede com
--   bcrypt + JWT proprio), pelo que a opcao nao se aplica ao fluxo real.
-- ============================================================================
