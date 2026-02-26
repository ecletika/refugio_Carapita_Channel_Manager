-- CreateTable
CREATE TABLE "Usuario" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nome" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "senha_hash" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'RECEPCAO',
    "criado_em" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Quarto" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nome" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "capacidade" INTEGER NOT NULL,
    "preco_base" DECIMAL NOT NULL,
    "descricao" TEXT,
    "fotos" TEXT,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "criado_em" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Hospede" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nome" TEXT NOT NULL,
    "email" TEXT,
    "telefone" TEXT,
    "nif" TEXT,
    "passaporte" TEXT
);

-- CreateTable
CREATE TABLE "Canal" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nome_canal" TEXT NOT NULL,
    "comissao_percentual" DECIMAL NOT NULL DEFAULT 0.0
);

-- CreateTable
CREATE TABLE "Reserva" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "quarto_id" TEXT NOT NULL,
    "hospede_id" TEXT NOT NULL,
    "canal_id" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDENTE',
    "data_check_in" DATETIME NOT NULL,
    "data_check_out" DATETIME NOT NULL,
    "valor_total" DECIMAL NOT NULL,
    "codigo_reserva_externo" TEXT,
    "criado_em" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" DATETIME NOT NULL,
    CONSTRAINT "Reserva_quarto_id_fkey" FOREIGN KEY ("quarto_id") REFERENCES "Quarto" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Reserva_hospede_id_fkey" FOREIGN KEY ("hospede_id") REFERENCES "Hospede" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Reserva_canal_id_fkey" FOREIGN KEY ("canal_id") REFERENCES "Canal" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "TarifaSazonal" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "quarto_id" TEXT NOT NULL,
    "data_inicio" DATETIME NOT NULL,
    "data_fim" DATETIME NOT NULL,
    "preco_noite" DECIMAL NOT NULL,
    CONSTRAINT "TarifaSazonal_quarto_id_fkey" FOREIGN KEY ("quarto_id") REFERENCES "Quarto" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Bloqueio" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "quarto_id" TEXT NOT NULL,
    "data_inicio" DATETIME NOT NULL,
    "data_fim" DATETIME NOT NULL,
    "motivo" TEXT,
    CONSTRAINT "Bloqueio_quarto_id_fkey" FOREIGN KEY ("quarto_id") REFERENCES "Quarto" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Usuario_email_key" ON "Usuario"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Canal_nome_canal_key" ON "Canal"("nome_canal");
