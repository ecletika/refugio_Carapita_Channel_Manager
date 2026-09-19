-- ============================================================================
-- Migration: integridade da sincronizacao iCal e protecao contra overbooking
-- Data: 2026-09-19
-- ----------------------------------------------------------------------------
-- INCIDENTE QUE ORIGINOU ESTA MIGRACAO
--   A 18/09/2026 as 22:00 a edge function `sync-ical` importou correctamente uma
--   reserva BOOKING (19/09 -> 20/09). Na execucao seguinte (00:00) a reserva ja
--   nao existia. O hospede estava na casa e o site mostrava as datas livres.
--
--   CADEIA DE FALHA (tres defeitos a somar):
--     1. Os feeds iCal do Booking e do Airbnb estavam a devolver HTTP 200 com o
--        calendario VAZIO (zero VEVENT). Confirmado por pedido directo:
--          Booking: BEGIN:VCALENDAR ... PRODID:-//admin.booking.com ... END
--          Airbnb : BEGIN:VCALENDAR ... PRODID:-//Airbnb Inc ... END
--     2. A `sync-ical` interpreta "UID que nao esta no feed" como "reserva
--        cancelada no canal". Com o feed vazio, isso significa TODAS.
--     3. O trigger `trigger_delete_reserva_cancelada` fazia DELETE da linha
--        assim que o status passava a CANCELADA. A reserva nao ficou cancelada:
--        desapareceu sem rasto.
--
--   Consequencia acumulada: NENHUMA reserva criada pela edge function alguma vez
--   sobreviveu. Das 7 reservas em base de dados, ZERO tinham `ical_uid`
--   preenchido. As reservas Booking que restam vieram do backend Node antigo
--   (ultima importacao 31/08/2026) e so sobreviveram porque tem ical_uid NULL,
--   o que as torna invisiveis para a logica de cancelamento.
--
-- O QUE ESTA MIGRACAO FAZ
--   1. Remove o trigger que apaga reservas canceladas (perda de dados).
--   2. Cria a tabela SyncLog - cada sincronizacao passa a deixar rasto.
--   3. Indice unico em Reserva(ical_uid) - impede importacoes duplicadas.
--   4. Trigger anti-overbooking para reservas que NAO vem de OTA.
--   5. Corrige o timeout dos cron jobs (5s por defeito; a sync demora 3,6-10,4s,
--      pelo que a resposta era SEMPRE descartada e nenhum erro era visivel).
-- ============================================================================


-- 1) Remover o trigger destrutivo ---------------------------------------------
--    Uma reserva cancelada tem de continuar a existir: e historico, e o
--    calendario ja a ignora (tarifas-calendario filtra CANCELADA/EXPIRADA).
DROP TRIGGER IF EXISTS trigger_delete_reserva_cancelada ON public."Reserva";
DROP FUNCTION IF EXISTS public.delete_reserva_on_cancelada();


-- 2) Registo de sincronizacoes ------------------------------------------------
--    Sem isto nao ha forma de saber se o iCal correu, o que trouxe, ou porque
--    falhou. Foi exactamente isso que permitiu 19 dias de silencio.
CREATE TABLE IF NOT EXISTS public."SyncLog" (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  executado_em     timestamptz NOT NULL DEFAULT now(),
  origem           text        NOT NULL DEFAULT 'CRON',   -- CRON | MANUAL
  canal            text        NOT NULL,                  -- AIRBNB | BOOKING | ICAL
  quarto_id        text,
  ok               boolean     NOT NULL,
  eventos_no_feed  integer     NOT NULL DEFAULT 0,
  criadas          integer     NOT NULL DEFAULT 0,
  atualizadas      integer     NOT NULL DEFAULT 0,
  canceladas       integer     NOT NULL DEFAULT 0,
  ignoradas        integer     NOT NULL DEFAULT 0,
  duracao_ms       integer,
  erro             text
);

CREATE INDEX IF NOT EXISTS synclog_executado_em_idx
  ON public."SyncLog" (executado_em DESC);

CREATE INDEX IF NOT EXISTS synclog_quarto_canal_idx
  ON public."SyncLog" (quarto_id, canal, executado_em DESC);

ALTER TABLE public."SyncLog" ENABLE ROW LEVEL SECURITY;
-- Sem policies: so a service_role (edge functions) le e escreve. O painel
-- admin chega aqui pela edge function `sync-ical`, que usa a service key.


-- 3) Impedir importacoes duplicadas do mesmo evento ---------------------------
--    O UID do iCal e a identidade da reserva no canal. Dois registos com o
--    mesmo UID sao sempre um erro.
CREATE UNIQUE INDEX IF NOT EXISTS reserva_ical_uid_key
  ON public."Reserva" (ical_uid)
  WHERE ical_uid IS NOT NULL;


-- 4) Guarda anti-overbooking --------------------------------------------------
--    A edge function `reservas-criar` inseria sem verificar sobreposicao: o site
--    aceitava uma reserva por cima de datas ja ocupadas. A verificacao existe
--    agora na funcao, mas a garantia tem de estar na base de dados - e o unico
--    sitio por onde passam todos os caminhos (site, admin, scripts).
--
--    REGRA: uma reserva de origem interna (site, admin, telefone) nunca pode
--    sobrepor-se a outra reserva activa nem a um bloqueio.
--    Reservas vindas de OTA (ical_uid preenchido) sao SEMPRE aceites: ja
--    aconteceram no canal, recusa-las so esconderia o conflito. O conflito fica
--    visivel no painel e no SyncLog.
--
--    Datas em semi-aberto [check_in, check_out): sair dia 20 e entrar dia 20
--    nao e sobreposicao.
CREATE OR REPLACE FUNCTION public.impedir_reserva_sobreposta()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  conflito text;
BEGIN
  -- Reservas ja canceladas/expiradas nao ocupam nada
  IF NEW.status IN ('CANCELADA', 'EXPIRADA') THEN
    RETURN NEW;
  END IF;

  -- Importacoes de OTA passam sempre (sao factos consumados, nao pedidos)
  IF NEW.ical_uid IS NOT NULL THEN
    RETURN NEW;
  END IF;

  SELECT r.numero_reserva INTO conflito
  FROM public."Reserva" r
  WHERE r.quarto_id = NEW.quarto_id
    AND r.id <> NEW.id
    AND r.status NOT IN ('CANCELADA', 'EXPIRADA')
    AND daterange(r.data_check_in::date, r.data_check_out::date, '[)')
     && daterange(NEW.data_check_in::date, NEW.data_check_out::date, '[)')
  LIMIT 1;

  IF conflito IS NOT NULL THEN
    -- A mensagem chega ao hospede num alert do site: nao pode revelar o numero
    -- da reserva de outra pessoa. O detalhe fica no DETAIL, so para os logs.
    RAISE EXCEPTION 'As datas escolhidas ja nao estao disponiveis. Por favor escolha outro periodo.'
      USING ERRCODE = 'exclusion_violation',
            DETAIL  = 'Sobreposicao com a reserva ' || conflito;
  END IF;

  SELECT b.motivo INTO conflito
  FROM public."Bloqueio" b
  WHERE b.quarto_id = NEW.quarto_id
    AND daterange(b.data_inicio::date, b.data_fim::date, '[]')
     && daterange(NEW.data_check_in::date, NEW.data_check_out::date, '[)')
  LIMIT 1;

  IF conflito IS NOT NULL THEN
    RAISE EXCEPTION 'As datas escolhidas ja nao estao disponiveis. Por favor escolha outro periodo.'
      USING ERRCODE = 'exclusion_violation',
            DETAIL  = 'Bloqueio no periodo: ' || conflito;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_impedir_reserva_sobreposta ON public."Reserva";
CREATE TRIGGER trg_impedir_reserva_sobreposta
BEFORE INSERT OR UPDATE OF quarto_id, data_check_in, data_check_out, status
ON public."Reserva"
FOR EACH ROW
EXECUTE FUNCTION public.impedir_reserva_sobreposta();


-- 5) Timeout dos cron jobs ----------------------------------------------------
--    net.http_post assume 5000 ms. Medicoes reais da sync-ical: 3,6 a 10,4 s.
--    Resultado: TODAS as chamadas do cron ficavam registadas em
--    net._http_response como "Timeout of 5000 ms reached", sem status_code e
--    sem corpo - ou seja, os erros que a funcao devolve nunca eram vistos.
--    A funcao continuava a correr ate ao fim (por isso a reserva chegou a ser
--    criada), mas o resultado era sempre deitado fora.
SELECT cron.alter_job(
  1,
  command := $cmd$
  SELECT net.http_post(
    url := 'https://vuidkeygtxfbgxvmilya.supabase.co/functions/v1/cron-emails',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer cron-carapita-2024"}'::jsonb,
    body := '{}'::jsonb,
    timeout_milliseconds := 55000
  );
  $cmd$
);

SELECT cron.alter_job(
  2,
  command := $cmd$
  SELECT net.http_post(
    url := 'https://vuidkeygtxfbgxvmilya.supabase.co/functions/v1/sync-ical/all',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer cron-carapita-2024"}'::jsonb,
    body := '{}'::jsonb,
    timeout_milliseconds := 55000
  );
  $cmd$
);

-- 6) Sincronizar de hora a hora, nao de 2 em 2 --------------------------------
--    Com o feed a variar, 2 horas de atraso e tempo a mais para o site aceitar
--    uma reserva por cima de datas ja ocupadas.
SELECT cron.alter_job(2, schedule := '15 * * * *');
