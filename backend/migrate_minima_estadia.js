require('dotenv').config();
const { Client } = require('pg');

const client = new Client({
    connectionString: process.env.DATABASE_URL + '&uselibpqcompat=true',
    ssl: { rejectUnauthorized: false }
});

async function main() {
    try {
        await client.connect();

        const queries = [
            'ALTER TABLE "TarifaSazonal" ADD COLUMN IF NOT EXISTS "minima_estadia" INTEGER DEFAULT 2;',
            'ALTER TABLE "Quarto" ADD COLUMN IF NOT EXISTS "minima_estadia_padrao" INTEGER DEFAULT 2;'
        ];

        for (const query of queries) {
            console.log("Running:", query);
            try {
                await client.query(query);
                console.log("Success.");
            } catch (e) {
                console.log("Error:", e.message);
            }
        }

    } catch (e) {
        console.error("Connection error", e);
    } finally {
        await client.end();
    }
}

main();
