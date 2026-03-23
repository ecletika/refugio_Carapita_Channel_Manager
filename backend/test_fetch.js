require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function test() {
    console.log('Fetching rooms...');
    const { data, error } = await supabase.from('Quarto').select('id, nome, fotos, ativo');
    if (error) {
        console.error('Error:', error);
        return;
    }
    console.log('Rooms found:', data.length);
    data.forEach(r => {
        console.log(`- ${r.nome} (Active: ${r.ativo}): ${r.fotos ? r.fotos.substring(0, 50) + '...' : 'No photos'}`);
    });
}

test();
