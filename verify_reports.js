const fetch = require('node-fetch');

async function verify() {
    try {
        console.log('Logging in as admin...');
        const loginResp = await fetch('http://localhost:5000/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: 'admin@refugiocarapita.com', senha: '123456' })
        });
        const loginData = await loginResp.json();

        if (loginData.status !== 'success') {
            console.error('Login failed:', loginData);
            return;
        }

        const token = loginData.token;
        console.log('Login successful. Fetching reports...');

        const reportResp = await fetch('http://localhost:5000/api/relatorios/geral', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const reportData = await reportResp.json();

        console.log('Report Data:', JSON.stringify(reportData, null, 2));

        if (reportData.status === 'success') {
            console.log('✅ Verification PASSED: Reports loaded successfully.');
        } else {
            console.error('❌ Verification FAILED:', reportData);
        }
    } catch (e) {
        console.error('❌ Verification Error:', e);
    }
}

verify();
