const supabase = require('./backend/src/config/supabase');

async function checkConfig() {
    try {
        const { data, error } = await supabase.supabaseAdmin.from('Configuracao').select('*');
        if (error) {
            console.error('Error fetching Configuracao:', error);
        } else {
            console.log('Configuracao table content:', data);
        }
    } catch (e) {
        console.error('Fatal error:', e);
    }
}

checkConfig();
