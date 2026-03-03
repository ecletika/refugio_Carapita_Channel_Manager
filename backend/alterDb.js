require('dotenv').config({ path: './.env' });
const { Client } = require('pg');
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

async function run() {
    const client = new Client({
        connectionString: process.env.DATABASE_URL
    });
    await client.connect();

    try {
        console.log("Altering Passeio...");
        await client.query(`
            ALTER TABLE "Passeio" ADD COLUMN IF NOT EXISTS "dias" INTEGER DEFAULT 1;
            ALTER TABLE "Passeio" ADD COLUMN IF NOT EXISTS "mostrar_perfil" BOOLEAN DEFAULT false;
        `);
        console.log("Passeio altered.");

        console.log("Altering Hospede...");
        await client.query(`
            ALTER TABLE "Hospede" ADD COLUMN IF NOT EXISTS "dependentes" JSONB DEFAULT '[]'::jsonb;
        `);
        console.log("Hospede altered.");

    } catch (e) {
        console.error(e);
    } finally {
        await client.end();
    }
}
run();
