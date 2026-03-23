const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Try to find .env manually
const envPath = path.join(__dirname, '.env');
const envContent = fs.readFileSync(envPath, 'utf8');
const lines = envContent.split('\n');
const env = {};
lines.forEach(line => {
    const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
    if (match) {
        let value = match[2] || '';
        if (value.startsWith('"') && value.endsWith('"')) value = value.substring(1, value.length - 1);
        env[match[1]] = value;
    }
});

const supabase = createClient(
    env.SUPABASE_URL,
    env.SUPABASE_SERVICE_ROLE_KEY
);

async function test() {
    console.log('Fetching rooms...');
    const { data, error } = await supabase.from('Quarto').select('id, nome, fotos, ativo');
    if (error) {
        console.error('Error:', error);
        return;
    }
    console.log(`Rooms found: ${data.length}`);
    data.forEach(r => {
        console.log(`- ${r.nome} (Active: ${r.ativo}): ${r.fotos ? r.fotos.substring(0, 50) : 'No photos'}`);
    });
}

test();
