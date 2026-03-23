const axios = require('axios');
const xml2js = require('xml2js');
const supabase = require('../config/supabase'); // using supabase client if available, else Prisma
const { create } = require('xmlbuilder2');

class AimaService {
    constructor() {
        this.wsdlProd = 'https://siba.ssi.gov.pt/baws/boletinsalojamento.asmx';
        this.wsdlDev = 'https://siba.ssi.gov.pt/bawsdev/boletinsalojamento.asmx';
    }

    get wsdlUrl() {
        return process.env.AIMA_ENV === 'production' ? this.wsdlProd : this.wsdlDev;
    }

    _formatDate(date) {
        if (!date) return '1900-01-01T00:00:00';
        const d = new Date(date);
        // AIMA exige xsd:dateTime (YYYY-MM-DDTHH:mm:ss)
        return d.toISOString().substring(0, 19);
    }

    _mapCountryCode(countryName) {
        if (!countryName) return 'PRT';
        const c = countryName.toUpperCase().trim();
        if (c.includes('PORTUG')) return 'PRT';
        if (c.includes('BRASIL')) return 'BRA';
        if (c.includes('ESPANHA')) return 'ESP';
        if (c.includes('FRAN') || c === 'FRANCE') return 'FRA';
        if (c.includes('ALEMANHA') || c === 'GERMANY') return 'DEU';
        if (c.includes('REINO UNIDO') || c.includes('INGLATERRA') || c === 'UK') return 'GBR';
        if (c.includes('ESTADOS UNIDOS') || c === 'USA') return 'USA';
        if (c.includes('ITX') || c.includes('ITA')) return 'ITA';
        if (c.includes('SUI') || c.includes('SWISS')) return 'CHE';
        if (c.includes('HOLANDA') || c.includes('NETHERLANDS')) return 'NLD';
        if (c.includes('BÉL') || c.includes('BEL')) return 'BEL';
        if (c.includes('IRLANDA') || c.includes('IRELAND')) return 'IRL';
        if (c.includes('CANAD') || c === 'CANADA') return 'CAN';
        return c.substring(0, 3);
    }

    gerarXML(hospedes, reserva) {
        // Tabela Unidade_Hoteleira
        const uhData = {
            Codigo_Unidade_Hoteleira: process.env.AIMA_NIPC || '260876640',
            Estabelecimento: process.env.AIMA_ESTABELECIMENTO || '00',
            Nome: 'Refugio Carapita'.substring(0, 40),
            Abreviatura: 'R Carapita'.substring(0, 15),
            Morada: 'Rua Principal'.substring(0, 40),
            Localidade: 'Carapita'.substring(0, 30),
            Codigo_Postal: '3200',
            Zona_Postal: '000',
            Telefone: '912345678',
            Nome_Contacto: 'Mauricio Junior'.substring(0, 40),
            Email_Contacto: 'mauriciociao@gmail.com'.substring(0, 140)
        };

        const root = create({ version: '1.0', encoding: 'UTF-8', standalone: 'yes' })
            .ele('MovimentoBAL', { xmlns: 'http://sef.pt/BAws' });

        // 1. Tabela Unidade_Hoteleira
        root.ele('Unidade_Hoteleira')
            .ele('Codigo_Unidade_Hoteleira').txt(uhData.Codigo_Unidade_Hoteleira).up()
            .ele('Estabelecimento').txt(uhData.Estabelecimento).up()
            .ele('Nome').txt(uhData.Nome).up()
            .ele('Abreviatura').txt(uhData.Abreviatura).up()
            .ele('Morada').txt(uhData.Morada).up()
            .ele('Localidade').txt(uhData.Localidade).up()
            .ele('Codigo_Postal').txt(uhData.Codigo_Postal).up()
            .ele('Zona_Postal').txt(uhData.Zona_Postal).up()
            .ele('Telefone').txt(uhData.Telefone).up()
            .ele('Fax').txt(uhData.Telefone).up()
            .ele('Nome_Contacto').txt(uhData.Nome_Contacto).up()
            .ele('Email_Contacto').txt(uhData.Email_Contacto).up()
            .up();

        // 2. Tabela Boletim_Alojamento para cada hóspede
        hospedes.forEach(h => {
            const apelido = (h.sobrenome || h.nome || 'DESCONHECIDO').substring(0, 40).replace(/[^A-Za-zÇÃÁÀÉÊÍÕÔÓÚ' \-]/g, '').toUpperCase();
            const nome = (h.nome || 'DESCONHECIDO').substring(0, 40).replace(/[^A-Za-zÇÃÁÀÉÊÍÕÔÓÚ' \-]/g, '').toUpperCase();
            const paisCode = this._mapCountryCode(h.nacionalidade || h.pais);
            const paisEmissor = h.pais_emissor_documento ? this._mapCountryCode(h.pais_emissor_documento) : paisCode;
            const tipoDocInput = (h.tipo_documento || '').toUpperCase();
            let tipoDoc = tipoDocInput.includes('PASSAPORTE') ? 'P' : (tipoDocInput.includes('BI') || tipoDocInput.includes('CIDAD') || tipoDocInput.includes('ID') ? 'I' : 'O');

            const ba = root.ele('Boletim_Alojamento')
                .ele('Apelido').txt(apelido).up();

            if (nome) ba.ele('Nome').txt(nome).up();

            ba.ele('Nacionalidade').txt(paisCode).up()
                .ele('Data_Nascimento').txt(this._formatDate(h.data_nascimento || '2000-01-01')).up();

            if (h.local_nascimento) {
                ba.ele('Local_Nascimento').txt(h.local_nascimento.substring(0, 30)).up();
            }

            ba.ele('Documento_Identificacao').txt((h.numero_documento || '00000000').replace(/[^0-9A-Z]/ig, '').substring(0, 16)).up()
                .ele('Pais_Emissor_Documento').txt(paisEmissor).up()
                .ele('Tipo_Documento').txt(tipoDoc).up()
                .ele('Data_Entrada').txt(this._formatDate(reserva.data_check_in)).up();

            if (reserva.data_check_out) {
                ba.ele('Data_Saida').txt(this._formatDate(reserva.data_check_out)).up();
            }

            ba.ele('Pais_Residencia_Origem').txt(paisCode).up()
                .ele('Local_Residencia_Origem').txt((h.cidade || '').substring(0, 30)).up()
                .up();
        });

        // 3. Tabela Envio
        root.ele('Envio')
            .ele('Numero_Ficheiro').txt('1').up()
            .ele('Data_Movimento').txt(this._formatDate(new Date())).up()
            .up();

        return root.end({ prettyPrint: false });
    }

    async enviarBoletim(hospedePrincipal, reserva) {
        let xmlParaEnvio = '';
        try {
            console.log("=========================================");
            console.log("🛂 [AIMA / SIBA] ENVIO DE BOLETINS DE ALOJAMENTO");
            console.log("=========================================");

            // Colecionar todos os hóspedes (Principal + Dependentes)
            const todosHospedes = [hospedePrincipal];
            if (hospedePrincipal.dependentes && Array.isArray(hospedePrincipal.dependentes)) {
                todosHospedes.push(...hospedePrincipal.dependentes);
            }

            xmlParaEnvio = this.gerarXML(todosHospedes, reserva);
            const boletinsBase64 = Buffer.from(xmlParaEnvio, 'utf-8').toString('base64');

            const soapEnvelope = `<?xml version="1.0" encoding="utf-8"?>
<soap:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
  <soap:Body>
    <EntregaBoletinsAlojamento xmlns="http://sef.pt/">
      <UnidadeHoteleira>${process.env.AIMA_NIPC || ''}</UnidadeHoteleira>
      <Estabelecimento>${process.env.AIMA_ESTABELECIMENTO || '00'}</Estabelecimento>
      <ChaveAcesso>${process.env.AIMA_CHAVE_ACESSO || ''}</ChaveAcesso>
      <Boletins>${boletinsBase64}</Boletins>
    </EntregaBoletinsAlojamento>
  </soap:Body>
</soap:Envelope>`;

            console.log("🚀 Enviando dados para o portal SIBA/AIMA...");

            const response = await axios.post(
                this.wsdlUrl,
                soapEnvelope,
                {
                    headers: {
                        'Content-Type': 'text/xml; charset=utf-8',
                        'SOAPAction': '"http://sef.pt/EntregaBoletinsAlojamento"'
                    }
                }
            );

            const responseData = response.data;
            const parser = new xml2js.Parser({ explicitArray: false });
            const parsedRes = await parser.parseStringPromise(responseData);

            const envelopeBody = parsedRes['soap:Envelope']?.['soap:Body'];
            const soapResult = envelopeBody?.['EntregaBoletinsAlojamentoResponse']?.['EntregaBoletinsAlojamentoResult'];

            let errorDesc = null;

            if (soapResult === '0') {
                console.log("✅ Boletim enviado com sucesso para a AIMA!");
                await this.registrarLog(reserva.id, hospedePrincipal, 'SUCESSO', null, xmlParaEnvio, responseData);
                console.log("=========================================");
                return { sucesso: true, mensagem: 'Boletim enviado para AIMA.' };
            } else {
                console.error("❌ Erro AIMA - Retorno XML:", soapResult);

                // parse XML de erro returned
                let errorObj = null;
                try {
                    errorObj = await parser.parseStringPromise(soapResult);
                    let erroBA = errorObj?.ErrosBA?.RetornoBA;
                    if (Array.isArray(erroBA)) erroBA = erroBA[0];
                    errorDesc = erroBA?.Descricao || errorObj?.Retorno?.Descricao || 'Erro desconhecido retornado pela AIMA.';
                } catch (parseErr) {
                    errorDesc = soapResult; // If it's not XML
                }

                await this.registrarLog(reserva.id, hospedePrincipal, 'ERRO', errorDesc, xmlParaEnvio, responseData);
                return { sucesso: false, erro: errorDesc };
            }

        } catch (error) {
            console.error("❌ Falha na comunicação SOAP para AIMA:", error.message);
            const erroMensagem = error.response ? JSON.stringify(error.response.data) : error.message;
            await this.registrarLog(reserva?.id, hospedePrincipal, 'ERRO', erroMensagem, xmlParaEnvio, erroMensagem);
            // We do not throw, so it doesn't block the check-in process. We return false.
            return { sucesso: false, erro: erroMensagem };
        }
    }

    async registrarLog(reservaId, hospede, status, erro, payload, resposta) {
        try {
            // Using Supabase to add log
            const logEntry = {
                reserva_id: reservaId || null,
                hospede_nome: hospede ? `${hospede.nome} ${hospede.sobrenome || ''}`.trim() : 'Desconhecido',
                status,
                erro,
                payload_xml: payload,
                resposta_xml: resposta
            };

            const { error: insertErr } = await supabase.supabaseAdmin
                .from('AimaLog')
                .insert([logEntry]);

            if (insertErr) {
                console.error('⚠️ Falha ao registrar log no AimaLog:', insertErr.message);
            }
        } catch (dbErr) {
            console.error('⚠️ Falha ao registrar log no AimaLog (Exceção):', dbErr.message);
        }
    }
}

module.exports = new AimaService();
