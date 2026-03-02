require('dotenv').config();
const aimaService = require('./src/services/aima.service');

const hospede = {
    nome: 'MAURICIO',
    sobrenome: 'JUNIOR',
    nacionalidade: 'PRT',
    tipo_documento: 'PASSAPORTE',
    numero_documento: 'A1234567',
    data_nascimento: '1990-01-01',
    cidade: 'Lisbon'
};

const reserva = {
    data_check_in: '2026-03-05',
    data_check_out: '2026-03-10'
};

try {
    const xml = aimaService.gerarXML(hospede, reserva);
    console.log("Generated XML:");
    console.log(xml);
} catch (error) {
    console.error("Error:", error);
}
