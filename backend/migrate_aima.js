require('dotenv').config();
const { Client } = require('pg');

const client = new Client({
    connectionString: process.env.DATABASE_URL + '&uselibpqcompat=true',
    ssl: { rejectUnauthorized: false }
});

async function main() {
    try {
        await client.connect();

        // Add AIMA columns to Hospede table
        const queries = [
            'ALTER TABLE "Hospede" ADD COLUMN IF NOT EXISTS "estrangeiro" BOOLEAN DEFAULT false;',
            'ALTER TABLE "Hospede" ADD COLUMN IF NOT EXISTS "data_nascimento" TEXT;',
            'ALTER TABLE "Hospede" ADD COLUMN IF NOT EXISTS "local_nascimento" TEXT;',
            'ALTER TABLE "Hospede" ADD COLUMN IF NOT EXISTS "nacionalidade" TEXT;',
            'ALTER TABLE "Hospede" ADD COLUMN IF NOT EXISTS "tipo_documento" TEXT;',
            'ALTER TABLE "Hospede" ADD COLUMN IF NOT EXISTS "numero_documento" TEXT;',
            'ALTER TABLE "Hospede" ADD COLUMN IF NOT EXISTS "pais_emissor_documento" TEXT;'
        ];

        for (const query of queries) {
            console.log("Running:", query);
            try {
                await client.query(query);
            } catch (e) {
                console.log("Error (might already exist):", e.message);
            }
        }
        console.log("AIMA fields added to Hospede successfully.");
    } catch (e) {
        console.error("Connection error", e);
    } finally {
        await client.end();
    }
}

main();
