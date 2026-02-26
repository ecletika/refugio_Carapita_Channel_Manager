const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY
);

async function listTables() {
    console.log('Fetching table list...');

    // In Supabase, we can't easily list tables via the standard SDK without RPC or querying a system table
    // But we can try to query common names to see which ones exist.
    const tablesToTry = ['Quarto', 'quartos', 'Reserva', 'reservas', 'Usuario', 'usuarios'];

    for (const table of tablesToTry) {
        const { data, error } = await supabase.from(table).select('*').limit(0);
        if (error) {
            console.log(`❌ Table "${table}" does not exist or error: ${error.message}`);
        } else {
            console.log(`✅ Table "${table}" exists.`);
        }
    }
}

listTables();
