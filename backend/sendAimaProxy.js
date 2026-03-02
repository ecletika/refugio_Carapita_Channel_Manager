require('dotenv').config({ path: './.env' });
const AimaService = require('./src/services/aima.service');
const axios = require('axios');

async function run() {
    process.env.AIMA_ENV = 'production';

    const hospede = {
        nome: 'Mauricio',
        sobrenome: 'Junior',
        nacionalidade: 'Brasileiro',
        tipo_documento: 'Passaporte',
        numero_documento: 'GC320806',
        pais_emissor_documento: 'Brasil',
        data_nascimento: '1968-05-13',
        cidade: 'Bauru'
    };
    const reserva = { id: "test-123", data_check_in: '2026-04-27', data_check_out: '2026-04-29' };

    console.log("Using Env: " + process.env.AIMA_ENV);
    const res = await AimaService.enviarBoletim(hospede, reserva);
    console.log("FINAL:", res);
}
run();
