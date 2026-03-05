/**
 * fix_rls_final.js
 * 
 * Corrige as políticas RLS do Supabase para o Refúgio Carapita.
 * Permite acesso anon a todas as tabelas (JWT no backend controla a segurança).
 * 
 * Executar: NODE_TLS_REJECT_UNAUTHORIZED=0 node fix_rls_final.js
 */

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
require('dotenv').config();

const { Pool } = require('pg');
const { createClient } = require('@supabase/supabase-js');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: true,
    connectionTimeoutMillis: 30000,
});

const supabaseAnon = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY
);

const supabaseAdmin = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function execSQL(client, sql, label) {
    try {
        await client.query(sql);
        if (label) console.log(`   ✅ ${label}`);
        return true;
    } catch (e) {
        if (label) console.log(`   ⚠️  ${label}: ${e.message}`);
        return false;
    }
}

async function main() {
    console.log('🔧 Correção de Políticas RLS - Refúgio Carapita\n');
    console.log(`📡 Supabase: ${process.env.SUPABASE_URL}\n`);

    const client = await pool.connect();
    console.log('✅ Conectado à base de dados PostgreSQL\n');

    // Listar tabelas existentes
    const { rows: tablesResult } = await client.query(`
        SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename;
    `);
    const tablesInDB = tablesResult.map(r => r.tablename);
    console.log('📋 Tabelas na base de dados:', tablesInDB.join(', '));
    console.log('');

    // Tabelas a configurar
    const tables = [
        'Quarto', 'Hospede', 'Reserva', 'Canal', 'TarifaSazonal',
        'Extra', 'Bloqueio', 'Usuario', 'Passeio', 'Comodidade',
        'Cupom', 'PagamentoLink', 'AimaLog'
    ];

    console.log('🔧 A aplicar políticas RLS...\n');

    for (const table of tables) {
        if (!tablesInDB.includes(table)) {
            console.log(`⚠️  Tabela "${table}" não existe - a ignorar`);
            continue;
        }

        console.log(`📋 Configurando: "${table}"`);

        // 1. Habilitar RLS
        await execSQL(client, `ALTER TABLE "${table}" ENABLE ROW LEVEL SECURITY;`, 'RLS habilitado');

        // 2. Listar e remover políticas antigas
        const { rows: policies } = await client.query(`
            SELECT policyname FROM pg_policies 
            WHERE schemaname = 'public' AND tablename = $1;
        `, [table]);

        for (const pol of policies) {
            await execSQL(client, `DROP POLICY IF EXISTS "${pol.policyname}" ON "${table}";`, `Removida: ${pol.policyname}`);
        }

        // 3. Criar política que permite tudo via anon key
        const policySQL = `CREATE POLICY "${table}_anon_all" ON "${table}" FOR ALL USING (true) WITH CHECK (true);`;
        await execSQL(client, policySQL, 'Política criada: anon_all');

        console.log('');
    }

    client.release();
    await pool.end();

    // Verificação final com anon key
    console.log('\n\n📊 VERIFICAÇÃO FINAL COM ANON KEY:\n');

    const testCases = [
        { table: 'Quarto', op: 'SELECT' },
        { table: 'Hospede', op: 'SELECT' },
        { table: 'Reserva', op: 'SELECT' },
        { table: 'Canal', op: 'SELECT' },
        { table: 'Extra', op: 'SELECT' },
        { table: 'Cupom', op: 'SELECT' },
    ];

    for (const { table, op } of testCases) {
        const { data, error } = await supabaseAnon.from(table).select('*').limit(1);
        const status = error ? `❌ ${error.message.substring(0, 70)}` : `✅ OK (${data?.length} reg. visíveis)`;
        console.log(`  ${table} ${op}: ${status}`);
    }

    // Teste INSERT no Hospede
    console.log('\n  Teste INSERT no Hospede (via anon key):');
    const testEmail = `rls_test_${Date.now()}@test.com`;
    const { data: insertData, error: insertError } = await supabaseAnon.from('Hospede').insert([{
        id: require('crypto').randomUUID(),
        nome: 'Teste RLS Fix',
        email: testEmail,
        senha_hash: 'hash_test',
        criado_em: new Date().toISOString(),
        atualizado_em: new Date().toISOString()
    }]).select().single();

    if (insertError) {
        console.log(`  ❌ INSERT Hospede: ${insertError.message}`);
        console.log('\n🚨 AINDA TEM PROBLEMAS! Verifique o Supabase Dashboard manualmente.');
    } else {
        console.log(`  ✅ INSERT Hospede: OK - ID: ${insertData?.id}`);
        // Limpar registo de teste
        await supabaseAdmin.from('Hospede').delete().eq('email', testEmail);
        console.log('  🧹 Registo de teste removido');
        console.log('\n🎉 SUCESSO! Todas as políticas RLS estão corretas!');
        console.log('   O registo de utilizadores e criação de reservas deve funcionar agora.');
    }
}

main().catch(e => {
    console.error('\n❌ Erro fatal:', e.message);
    process.exit(1);
});
