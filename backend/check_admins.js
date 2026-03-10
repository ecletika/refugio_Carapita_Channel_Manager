
const supabase = require('./src/config/supabase');

async function listAdmins() {
    try {
        const { data, error } = await supabase
            .from('Usuario')
            .select('id, email, nome, role');
        
        if (error) {
            console.error('Erro ao buscar usuários:', error);
            return;
        }
        
        console.log('Usuários cadastrados:');
        console.table(data);
    } catch (e) {
        console.error('Erro:', e);
    }
}

listAdmins();
