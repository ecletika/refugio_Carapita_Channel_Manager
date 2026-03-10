
const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcryptjs');

// Configurações do seu banco de dados (vindos do seu .env)
const SUPABASE_URL = "https://vuidkeygtxfbgxvmilya.supabase.co";
const SUPABASE_SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ1aWRrZXlndHhmYmd4dm1pbHlhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjA2NDM0MywiZXhwIjoyMDg3NjQwMzQzfQ.gVY5kY8kzt-9UKy37gaEwI44Q4e1WXB_OkVnV0aNWck";

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function fixAdmin(email, newPassword) {
    console.log(`\n--- Configurando Admin para: ${email} ---`);
    
    // 1. Gerar Hash da Senha fornecida pelo Usuário
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(newPassword, salt);

    // 2. Tabela de Usuários do Sistema (Tabela Usuario)
    const { data: user, error: userError } = await supabase
        .from('Usuario')
        .select('*')
        .eq('email', email)
        .single();

    if (user) {
        console.log('✅ Usuário encontrado no banco. Atualizando hash da senha e cargo para ADMIN...');
        const { error: upError } = await supabase
            .from('Usuario')
            .update({ senha_hash: hash, role: 'ADMIN' })
            .eq('id', user.id);
        if (upError) console.error('Erro ao atualizar tabela:', upError);
    } else {
        console.log('⚠️ Usuário não existia no banco. Criando novo...');
        const { error: insError } = await supabase
            .from('Usuario')
            .insert({ nome: 'Admin', email: email, senha_hash: hash, role: 'ADMIN' });
        if (insError) console.error('Erro ao inserir no banco:', insError);
    }

    // 3. Autenticação do Supabase (GoTrue) - Essencial para o login via Auth
    const { data: authData, error: listError } = await supabase.auth.admin.listUsers();
    
    if (listError) {
        console.error('Erro ao listar usuários do Auth:', listError);
    } else {
        const authUser = authData.users.find(u => u.email === email);
        if (authUser) {
            console.log('✅ Usuário encontrado no Auth. Redefinindo senha...');
            const { error: authUpError } = await supabase.auth.admin.updateUserById(
                authUser.id,
                { password: newPassword, user_metadata: { role: 'ADMIN' } }
            );
            if (authUpError) console.error('Erro ao atualizar no Auth:', authUpError);
        } else {
            console.log('⚠️ Usuário não existia no Auth. Criando usuário para autenticação...');
            const { error: authCreError } = await supabase.auth.admin.createUser({
                email: email,
                password: newPassword,
                email_confirm: true,
                user_metadata: { role: 'ADMIN' }
            });
            if (authCreError) console.error('Erro ao criar no Auth:', authCreError);
        }
    }
}

async function run() {
    // Senha fornecida pelo usuário
    const pass = "Brasil@130568";
    
    // Configura para os dois emails possíveis
    await fixAdmin('contato@refugiocarapita.pt', pass);
    await fixAdmin('mauriciociao@gmail.com', pass);
    
    console.log('\n--- FINALIZADO COM SUCESSO ---');
    console.log(`Agora você já pode entrar no painel com o email: contato@refugiocarapita.pt`);
    console.log(`Senha: ${pass}`);
}

run();
