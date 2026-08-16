-- ============================================================================
-- Migration: corrigir os cron jobs (emails automaticos e sync iCal)
-- Data: 2026-08-16
-- ----------------------------------------------------------------------------
-- Os dois jobs em cron.job chamavam `extensions.http_post`, que NAO existe neste
-- projeto. Falhavam a 100% desde que foram criados, com:
--
--   ERROR: function extensions.http_post(url => unknown, headers => jsonb,
--          body => jsonb) does not exist
--
-- CONSEQUENCIA (silenciosa, ninguem deu por ela):
--   * job 1 (de hora a hora) -> NENHUM email automatico foi alguma vez enviado:
--       - lembretes de pagamento inicial (24h, 36h, 40h, 47h)
--       - cancelamento automatico por falta de pagamento (48h)
--       - email de boas-vindas apos o pagamento inicial
--       - lembretes do pagamento final (30, 20, 15, 14, 13, 12, 11, 10 dias)
--       - cancelamento por falta de pagamento final
--       - email de reserva 100% paga e emails mensais
--   * job 2 (de 2 em 2 horas) -> o iCal nunca sincronizou automaticamente, ou seja
--       reservas de Booking/Airbnb nao entravam sozinhas (risco de overbooking).
--
-- A funcao correta e `net.http_post` (extensao pg_net), ja instalada:
--   net.http_post(url text, body jsonb, params jsonb, headers jsonb,
--                 timeout_milliseconds integer)
--
-- Verificado apos a correcao: net.http_post devolveu request_id e a resposta
-- ficou com status_code 200 ({"status":"ok", ...}).
--
-- NOTA: a edge function `cron-emails` em si sempre esteve correta e as 8 colunas
-- de controlo (email_lembrete_*_enviado, email_boasvindas_enviado,
-- emails_pagamento_final_enviados, email_total_enviado,
-- proxima_mensagem_mensal_em) ja existiam. So o agendamento e que estava partido.
-- ============================================================================

SELECT cron.alter_job(
  1,
  command := $cmd$
  SELECT net.http_post(
    url := 'https://vuidkeygtxfbgxvmilya.supabase.co/functions/v1/cron-emails',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer cron-carapita-2024"}'::jsonb,
    body := '{}'::jsonb
  );
  $cmd$
);

SELECT cron.alter_job(
  2,
  command := $cmd$
  SELECT net.http_post(
    url := 'https://vuidkeygtxfbgxvmilya.supabase.co/functions/v1/sync-ical/all',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer cron-carapita-2024"}'::jsonb,
    body := '{}'::jsonb
  );
  $cmd$
);
