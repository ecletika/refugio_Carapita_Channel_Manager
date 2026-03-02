require('dotenv').config();
const { Client } = require('pg');

const client = new Client({
    connectionString: process.env.DATABASE_URL + '&uselibpqcompat=true',
    ssl: { rejectUnauthorized: false }
});

async function main() {
    try {
        await client.connect();

        const query = 'ALTER TABLE "TarifaSazonal" ADD COLUMN IF NOT EXISTS "politica_cancelamento" TEXT DEFAULT \'FLEXIVEL\';';
        console.log("Running:", query);
        try {
            await client.query(query);
            console.log("Success.");
        } catch (e) {
            console.log("Error (might already exist):", e.message);
        }

    } catch (e) {
        console.error("Connection error", e);
    } finally {
        await client.end();
    }
}

main();
