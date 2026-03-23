const { Client } = require('pg');
require('dotenv').config();

async function checkRooms() {
    const client = new Client({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false }
    });

    try {
        await client.connect();
        console.log('Connected to DB.');
        const res = await client.query('SELECT id, nome, fotos, ativo FROM "Quarto"');
        console.log(`Found ${res.rows.length} rooms.`);
        res.rows.forEach(row => {
            console.log(`- ${row.nome} (Active: ${row.ativo}): ${row.fotos ? row.fotos.substring(0, 100) + '...' : 'NULL'}`);
        });
    } catch (e) {
        console.error('Error:', e.message);
    } finally {
        await client.end();
    }
}

checkRooms();
