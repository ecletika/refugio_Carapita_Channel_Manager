require('dotenv').config({ path: './.env' });
const AimaService = require('./src/services/aima.service');

const hospede = {
    nome: "Joao",
    sobrenome: "Silva",
    nacionalidade: "Portugal",
    tipo_documento: "Cartao de Cidadao",
    numero_documento: "12345678",
    pais_emissor_documento: "Portugal",
    data_nascimento: "1980-05-15",
    cidade: "Lisboa"
};

const reserva = {
    id: "reserva-123",
    data_check_in: new Date().toISOString(),
    data_check_out: new Date(Date.now() + 86400000).toISOString()
};

async function test() {
    process.env.AIMA_ENV = 'development';
    console.log("XML Payload:");
    const xml = AimaService.gerarXML(hospede, reserva);
    console.log(xml);
    const result = await AimaService.enviarBoletim(hospede, reserva);
    console.log("Result:", result);
}
test();
