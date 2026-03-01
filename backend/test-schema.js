require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);
async function run() {
    const { data, error } = await supabase.from('Reserva').select('*').limit(1);
    console.log(data);
}
run();
