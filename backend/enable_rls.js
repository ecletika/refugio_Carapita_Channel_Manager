const { Client } = require('pg');
require('dotenv').config();

const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function enableRLS() {
    try {
        await client.connect();
        console.log("Conectado à Base de Dados. A habilitar o RLS...");

        // Obter todas as tabelas públicas
        const { rows } = await client.query(`
            SELECT tablename 
            FROM pg_tables 
            WHERE schemaname = 'public'
        `);

        for (const row of rows) {
            const table = row.tablename;

            // Ignorar tabelas de migração
            if (table.startsWith('_')) continue;

            console.log(`A ativar RLS em: "${table}"`);

            // Habilitar proteção RLS
            await client.query(`ALTER TABLE "${table}" ENABLE ROW LEVEL SECURITY;`);

            // Eliminar políticas antigas caso existam para limpar acessos
            // Este passo não dará erro se não existirem
            await client.query(`
                DO $$
                DECLARE
                    pol RECORD;
                BEGIN
                    FOR pol IN
                        SELECT policyname
                        FROM pg_policies
                        WHERE schemaname = 'public' AND tablename = '${table}'
                    LOOP
                        EXECUTE format('DROP POLICY IF EXISTS %s ON "${table}"', pol.policyname);
                    END LOOP;
                END
                $$;
            `);

            console.log(`  -> RLS ativada e devidamente restrita. Apenas Superuser e Service_Role terão acesso direto.`);
        }

        console.log("\nProcesso concluído! A base de dados encontra-se agora com RLS ativado.");
    } catch (e) {
        console.error("Erro durante a migração RLS:", e);
    } finally {
        await client.end();
    }
}

enableRLS();
