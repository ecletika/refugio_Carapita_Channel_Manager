CREATE TABLE IF NOT EXISTS "AimaLog" (
  "id" TEXT PRIMARY KEY,
  "reserva_id" TEXT,
  "hospede_nome" TEXT,
  "status" TEXT NOT NULL,
  "erro" TEXT,
  "payload_xml" TEXT,
  "resposta_xml" TEXT,
  "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
