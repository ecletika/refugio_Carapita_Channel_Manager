-- ═══════════════════════════════════════════════════════════════════════════
-- Refúgio Carapita — Migração: Colunas para Gestão de Pagamentos em Parcelas
-- Executar no Supabase SQL Editor
-- ═══════════════════════════════════════════════════════════════════════════

-- 1. Adicionar colunas de controlo de pagamento à tabela Reserva
ALTER TABLE "Reserva"
    ADD COLUMN IF NOT EXISTS pagamento_inicial_em        TIMESTAMPTZ DEFAULT NULL,
    ADD COLUMN IF NOT EXISTS pagamento_total_em          TIMESTAMPTZ DEFAULT NULL,
    ADD COLUMN IF NOT EXISTS email_lembrete_24h_enviado  BOOLEAN     DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS email_lembrete_36h_enviado  BOOLEAN     DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS email_lembrete_40h_enviado  BOOLEAN     DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS email_lembrete_47h_enviado  BOOLEAN     DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS email_boasvindas_enviado    BOOLEAN     DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS proxima_mensagem_mensal_em  TIMESTAMPTZ DEFAULT NULL,
    ADD COLUMN IF NOT EXISTS emails_pagamento_final_enviados JSONB   DEFAULT '[]'::jsonb;

-- 2. Criar índices para performance nas queries do scheduler
CREATE INDEX IF NOT EXISTS idx_reserva_status_pagamento
    ON "Reserva" (status, pagamento_inicial_em, pagamento_total_em);

CREATE INDEX IF NOT EXISTS idx_reserva_check_in
    ON "Reserva" (data_check_in);

-- 3. Confirmar
SELECT
    column_name,
    data_type,
    column_default
FROM information_schema.columns
WHERE table_name = 'Reserva'
  AND column_name IN (
      'pagamento_inicial_em',
      'pagamento_total_em',
      'email_lembrete_24h_enviado',
      'email_lembrete_36h_enviado',
      'email_lembrete_40h_enviado',
      'email_lembrete_47h_enviado',
      'email_boasvindas_enviado',
      'proxima_mensagem_mensal_em',
      'emails_pagamento_final_enviados'
  )
ORDER BY column_name;
