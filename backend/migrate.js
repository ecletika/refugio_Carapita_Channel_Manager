process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
require('dotenv').config();
const { Client } = require('pg');

const client = new Client({
    connectionString: process.env.DATABASE_URL + '&uselibpqcompat=true',
    ssl: { rejectUnauthorized: false }
});

async function main() {
    try {
        await client.connect();

        // Adicionar 'foto' à tabela 'Extra'
        console.log("Adding 'foto' to Extra...");
        try {
            await client.query('ALTER TABLE "Extra" ADD COLUMN "foto" TEXT;');
            console.log("Success.");
        } catch (e) {
            console.log("Skipping (might exist or error):", e.message);
        }

        // Adicionar 'extras_ids' à tabela 'Reserva'
        console.log("Adding 'extras_ids' to Reserva...");
        try {
            // Using TEXT[] array type
            await client.query('ALTER TABLE "Reserva" ADD COLUMN "extras_ids" TEXT[];');
            console.log("Success.");
        } catch (e) {
            console.log("Skipping (might exist or error):", e.message);
        }

    } catch (e) {
        console.error("Connection error", e);
    } finally {
        await client.end();
    }
}

main();
