/**
 * Script de migração — Adicionar colunas de pagamento via Supabase Admin
 * Executar com: node migrate_pagamentos.js
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseAdmin = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { autoRefreshToken: false, persistSession: false } }
);

const colunas = [
    { nome: 'pagamento_inicial_em', tipo: 'TIMESTAMPTZ', padrao: 'NULL' },
    { nome: 'pagamento_total_em', tipo: 'TIMESTAMPTZ', padrao: 'NULL' },
    { nome: 'email_lembrete_24h_enviado', tipo: 'BOOLEAN', padrao: 'FALSE' },
    { nome: 'email_lembrete_36h_enviado', tipo: 'BOOLEAN', padrao: 'FALSE' },
    { nome: 'email_lembrete_40h_enviado', tipo: 'BOOLEAN', padrao: 'FALSE' },
    { nome: 'email_lembrete_47h_enviado', tipo: 'BOOLEAN', padrao: 'FALSE' },
    { nome: 'email_boasvindas_enviado', tipo: 'BOOLEAN', padrao: 'FALSE' },
    { nome: 'proxima_mensagem_mensal_em', tipo: 'TIMESTAMPTZ', padrao: 'NULL' },
    { nome: 'emails_pagamento_final_enviados', tipo: 'JSONB', padrao: "'[]'::jsonb" },
];

async function verificarColunas() {
    console.log('\n🔍 Verificando colunas existentes na tabela Reserva...\n');

    const { data, error } = await supabaseAdmin
        .from('Reserva')
        .select('*')
        .limit(1);

    if (error) {
        console.error('❌ Erro ao aceder à tabela Reserva:', error.message);
        return;
    }

    const colunasExistentes = data && data.length > 0 ? Object.keys(data[0]) : [];
    console.log('📋 Colunas existentes:', colunasExistentes.join(', '));

    const colunasFaltando = colunas.filter(c => !colunasExistentes.includes(c.nome));

    if (colunasFaltando.length === 0) {
        console.log('\n✅ TODAS as colunas necessárias já existem! Nenhuma migração necessária.\n');
        return;
    }

    console.log(`\n⚠️  Colunas em falta (${colunasFaltando.length}):`);
    colunasFaltando.forEach(c => console.log(`   - ${c.nome} (${c.tipo})`));

    console.log('\n📋 SQL para executar no Supabase Dashboard (SQL Editor):\n');
    console.log('-- Executar no Supabase Dashboard > SQL Editor');
    colunasFaltando.forEach(c => {
        console.log(`ALTER TABLE "Reserva" ADD COLUMN IF NOT EXISTS ${c.nome} ${c.tipo} DEFAULT ${c.padrao};`);
    });

    console.log('\n🔗 Aceda a: https://supabase.com/dashboard > SQL Editor > Colar e executar o SQL acima\n');
}

verificarColunas().catch(console.error);
