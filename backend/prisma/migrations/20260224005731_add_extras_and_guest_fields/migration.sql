/*
  Warnings:

  - Added the required column `atualizado_em` to the `Hospede` table without a default value. This is not possible if the table is not empty.
  - Made the column `email` on table `Hospede` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "Quarto" ADD COLUMN "comodidades" TEXT;
ALTER TABLE "Quarto" ADD COLUMN "ical_url" TEXT;

-- AlterTable
ALTER TABLE "Reserva" ADD COLUMN "extras_ids" TEXT;
ALTER TABLE "Reserva" ADD COLUMN "metodo_pagamento" TEXT;
ALTER TABLE "Reserva" ADD COLUMN "requerimentos_especiais" TEXT;

-- AlterTable
ALTER TABLE "TarifaSazonal" ADD COLUMN "motivo" TEXT;

-- CreateTable
CREATE TABLE "Extra" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nome" TEXT NOT NULL,
    "descricao" TEXT,
    "preco" DECIMAL NOT NULL DEFAULT 0,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "icone" TEXT,
    "criado_em" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Hospede" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "prefixo" TEXT,
    "nome" TEXT NOT NULL,
    "sobrenome" TEXT,
    "email" TEXT NOT NULL,
    "senha_hash" TEXT,
    "telefone" TEXT,
    "pais" TEXT,
    "endereco1" TEXT,
    "endereco2" TEXT,
    "cidade" TEXT,
    "cep" TEXT,
    "nif" TEXT,
    "passaporte" TEXT,
    "criado_em" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" DATETIME NOT NULL
);
INSERT INTO "new_Hospede" ("email", "id", "nif", "nome", "passaporte", "telefone") SELECT "email", "id", "nif", "nome", "passaporte", "telefone" FROM "Hospede";
DROP TABLE "Hospede";
ALTER TABLE "new_Hospede" RENAME TO "Hospede";
CREATE UNIQUE INDEX "Hospede_email_key" ON "Hospede"("email");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
