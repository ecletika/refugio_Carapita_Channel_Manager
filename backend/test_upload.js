const jwt = require('jsonwebtoken');
const axios = require('axios');
const fs = require('fs');
const FormData = require('form-data');
require('dotenv').config();

const token = jwt.sign({ id: 'test', role: 'ADMIN' }, process.env.JWT_SECRET || 'super-secret-key-carapita-2024');

async function run() {
    const form = new FormData();
    form.append('foto', fs.createReadStream('node_modules/prisma/build/public/icon-1024.png'));
    try {
        const res = await axios.post('http://localhost:5000/api/upload', form, {
            headers: {
                ...form.getHeaders(),
                authorization: `Bearer ${token}`
            }
        });
        console.dir(res.data);
    } catch(err) {
        console.error(err.response?.data || err.message);
    }
}
run();
