const { Client } = require('pg');
require('dotenv').config();

async function listAllTables() {
    const client = new Client({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false }
    });

    try {
        await client.connect();
        console.log('Connected to DB.');
        const res = await client.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public'
        `);
        console.log('Tables in public schema:');
        res.rows.forEach(row => console.log(`- ${row.table_name}`));
    } catch (e) {
        console.error('Error:', e.message);
    } finally {
        await client.end();
    }
}

listAllTables();
