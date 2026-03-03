require('dotenv').config({ path: './.env' });
const { Client } = require('pg');
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

async function run() {
    const client = new Client({ connectionString: process.env.DATABASE_URL });
    await client.connect();
    try {
        await client.query(`ALTER TABLE "Hospede" ADD COLUMN IF NOT EXISTS "foto_perfil" TEXT;`);
        console.log("Hospede foto_perfil added.");
    } catch (e) {
        console.error(e);
    } finally {
        await client.end();
    }
}
run();
