const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY
);

async function test() {
    console.log('Testing Supabase connection...');
    console.log('URL:', process.env.SUPABASE_URL);

    try {
        const { data, error } = await supabase.from('Usuario').select('*').limit(1);

        if (error) {
            console.error('❌ Supabase error:', error.message);
            console.error('Details:', error);
        } else {
            console.log('✅ Supabase connection successful!');
            console.log('Data sample (Usuario):', data);
        }
    } catch (err) {
        console.error('❌ Unexpected error:', err.message);
    }
}

test();
