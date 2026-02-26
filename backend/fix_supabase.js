const { Client } = require('pg');
const bcrypt = require('bcryptjs');
require('dotenv').config();

async function fix() {
    console.log('--- Iniciando Fix Supabase ---');
    const client = new Client({
        connectionString: process.env.DATABASE_URL,
        ssl: {
            rejectUnauthorized: false
        }
    });

    try {
        await client.connect();
        console.log('✅ Conectado ao Postgres!');

        const tables = ['Usuario', 'Quarto', 'Hospede', 'Canal', 'Extra', 'Reserva', 'TarifaSazonal', 'Bloqueio'];

        for (const t of tables) {
            try {
                await client.query(`ALTER TABLE "${t}" DISABLE ROW LEVEL SECURITY;`);
                console.log(`RLS desativado para: ${t}`);
            } catch (err) {
                console.log(`⚠️ Aviso em ${t}: ${err.message}`);
            }
        }

        const hash = await bcrypt.hash('admin123', 10);
        await client.query(
            'INSERT INTO "Usuario" (nome, email, senha_hash, role) VALUES ($1, $2, $3, $4) ON CONFLICT (email) DO UPDATE SET senha_hash = EXCLUDED.senha_hash',
            ['Administrador', 'admin@carapita.com', hash, 'ADMIN']
        );
        console.log('✅ Admin (admin@carapita.com / admin123) garantido!');

    } catch (e) {
        console.error('❌ ERRO:', e.message);
    } finally {
        await client.end();
        console.log('--- Fim ---');
    }
}

fix();
