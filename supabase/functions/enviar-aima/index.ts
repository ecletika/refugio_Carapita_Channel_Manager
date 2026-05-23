import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";
import { jwtVerify } from "npm:jose@5";

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || 'https://vuidkeygtxfbgxvmilya.supabase.co';
const SUPABASE_SRK  = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
const JWT_SECRET    = new TextEncoder().encode(Deno.env.get('JWT_SECRET') || 'super-secret-key-carapita-2024');
const AIMA_NIPC     = Deno.env.get('AIMA_NIPC') || '260876640';
const AIMA_ESTAB    = Deno.env.get('AIMA_ESTABELECIMENTO') || '00';
const AIMA_CHAVE    = Deno.env.get('AIMA_CHAVE_ACESSO') || '';
const AIMA_ENV_VAL  = Deno.env.get('AIMA_ENV') || '';
const AIMA_URL      = AIMA_ENV_VAL === 'production'
  ? 'https://siba.ssi.gov.pt/baws/boletinsalojamento.asmx'
  : 'https://siba.ssi.gov.pt/bawsdev/boletinsalojamento.asmx';

console.log('[AIMA-CONFIG] ENV:', AIMA_ENV_VAL);
console.log('[AIMA-CONFIG] URL:', AIMA_URL);
console.log('[AIMA-CONFIG] NIPC:', AIMA_NIPC);
console.log('[AIMA-CONFIG] ESTAB:', AIMA_ESTAB);
console.log('[AIMA-CONFIG] CHAVE length:', AIMA_CHAVE.length, '| first3:', AIMA_CHAVE.substring(0, 3));

const cors = { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization,content-type', 'Access-Control-Allow-Methods': 'GET,POST,OPTIONS' };
const supabase = createClient(SUPABASE_URL, SUPABASE_SRK);

async function verifyAdmin(req: Request) {
  const auth = req.headers.get('authorization');
  if (!auth?.startsWith('Bearer ')) throw Object.assign(new Error('Unauthorized'), { statusCode: 401 });
  try {
    const { payload } = await jwtVerify(auth.slice(7), JWT_SECRET);
    if (!['ADMIN', 'RECEPCAO'].includes(payload.role as string)) throw new Error();
    return payload;
  } catch { throw Object.assign(new Error('Unauthorized'), { statusCode: 401 }); }
}

function xmlEscape(s: string) {
  return (s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
function fmtDate(d: string | null) {
  if (!d) return '1900-01-01T00:00:00';
  return new Date(d).toISOString().substring(0, 19);
}
function countryCode(name: string): string {
  const c = (name || '').toUpperCase();
  if (c.includes('PORTUG')) return 'PRT';
  if (c.includes('BRASIL')) return 'BRA';
  if (c.includes('ESPAN') || c === 'ESP') return 'ESP';
  if (c.includes('FRAN')) return 'FRA';
  if (c.includes('ALEMANHA') || c === 'GERMANY') return 'DEU';
  if (c.includes('REINO UNIDO') || c.includes('INGLAT') || c === 'UK') return 'GBR';
  if (c.includes('EUA') || c.includes('ESTADOS UNIDOS') || c === 'USA') return 'USA';
  if (c.includes('ITAL')) return 'ITA';
  if (c.includes('SUI') || c.includes('SUI')) return 'CHE';
  if (c.includes('HOLANDA') || c.includes('NETHERLANDS')) return 'NLD';
  if (c.includes('BEL')) return 'BEL';
  if (c.includes('IRLAND')) return 'IRL';
  if (c.includes('CANAD')) return 'CAN';
  if (c.includes('ANGOLA')) return 'AGO';
  if (c.includes('MOCAMBIQUE')) return 'MOZ';
  if (c.includes('CABO VERDE')) return 'CPV';
  return c.replace(/[^A-Z]/g, '').substring(0, 3).padEnd(3, 'X');
}
function tipoDoc(tipo: string): string {
  const t = (tipo || '').toUpperCase();
  if (t.includes('PASSAPORTE')) return 'P';
  if (t.includes('BI') || t.includes('IDENTIDADE') || t.includes('CIDAD')) return 'I';
  return 'O';
}
function sanitizeName(s: string, max = 40) {
  return (s || 'DESCONHECIDO').substring(0, max).toUpperCase().replace(/[^A-ZÀ-ÿ' \-]/g, '');
}
function utf8ToBase64(str: string): string {
  const bytes = new TextEncoder().encode(str);
  let bin = '';
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin);
}

function buildXML(hospedes: Record<string, string>[], reserva: Record<string, string>, cfg: Record<string, string>): string {
  const tel = (cfg.telefoneReservas || cfg.whatsapp || '000000000').replace(/\D/g, '').substring(0, 10) || '000000000';
  const uh = [
    `<Codigo_Unidade_Hoteleira>${xmlEscape(AIMA_NIPC)}</Codigo_Unidade_Hoteleira>`,
    `<Estabelecimento>${xmlEscape(AIMA_ESTAB)}</Estabelecimento>`,
    `<Nome>${xmlEscape('Refugio Carapita'.substring(0, 40))}</Nome>`,
    `<Abreviatura>${xmlEscape('R Carapita'.substring(0, 15))}</Abreviatura>`,
    `<Morada>${xmlEscape((cfg.endereco || 'Portugal').substring(0, 40))}</Morada>`,
    `<Localidade>${xmlEscape('Portugal'.substring(0, 30))}</Localidade>`,
    `<Codigo_Postal>0000</Codigo_Postal>`,
    `<Zona_Postal>000</Zona_Postal>`,
    `<Telefone>${xmlEscape(tel)}</Telefone>`,
    `<Fax>${xmlEscape(tel)}</Fax>`,
    `<Nome_Contacto>${xmlEscape((cfg.nomeResponsavel || 'Responsavel').substring(0, 40))}</Nome_Contacto>`,
    `<Email_Contacto>${xmlEscape((cfg.emailContato || 'contacto@refugiocarapita.pt').substring(0, 140))}</Email_Contacto>`,
  ].join('');

  const boletins = hospedes.map(h => {
    const pais = countryCode(h.nacionalidade || h.pais || 'Portugal');
    const emissor = h.pais_emissor_documento ? countryCode(h.pais_emissor_documento) : pais;
    const doc = (h.numero_documento || '00000000').replace(/[^0-9A-Z]/ig, '').substring(0, 16);
    return [
      `<Boletim_Alojamento>`,
      `<Apelido>${xmlEscape(sanitizeName(h.sobrenome || h.nome))}</Apelido>`,
      `<Nome>${xmlEscape(sanitizeName(h.nome))}</Nome>`,
      `<Nacionalidade>${pais}</Nacionalidade>`,
      `<Data_Nascimento>${fmtDate(h.data_nascimento)}</Data_Nascimento>`,
      h.local_nascimento ? `<Local_Nascimento>${xmlEscape(h.local_nascimento.substring(0, 30))}</Local_Nascimento>` : '',
      `<Documento_Identificacao>${xmlEscape(doc)}</Documento_Identificacao>`,
      `<Pais_Emissor_Documento>${emissor}</Pais_Emissor_Documento>`,
      `<Tipo_Documento>${tipoDoc(h.tipo_documento)}</Tipo_Documento>`,
      `<Data_Entrada>${fmtDate(reserva.data_check_in)}</Data_Entrada>`,
      reserva.data_check_out ? `<Data_Saida>${fmtDate(reserva.data_check_out)}</Data_Saida>` : '',
      `<Pais_Residencia_Origem>${pais}</Pais_Residencia_Origem>`,
      h.cidade ? `<Local_Residencia_Origem>${xmlEscape(h.cidade.substring(0, 30))}</Local_Residencia_Origem>` : '',
      `</Boletim_Alojamento>`,
    ].join('');
  }).join('');

  return [
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>`,
    `<MovimentoBAL xmlns="http://sef.pt/BAws">`,
    `<Unidade_Hoteleira>${uh}</Unidade_Hoteleira>`,
    boletins,
    `<Envio><Numero_Ficheiro>1</Numero_Ficheiro><Data_Movimento>${fmtDate(new Date().toISOString())}</Data_Movimento></Envio>`,
    `</MovimentoBAL>`,
  ].join('');
}

async function sendSOAP(xml: string): Promise<{ sucesso: boolean; erro?: string; raw: string }> {
  const b64 = utf8ToBase64(xml);
  const soap = [
    `<?xml version="1.0" encoding="utf-8"?>`,
    `<soap:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">`,
    `<soap:Body><EntregaBoletinsAlojamento xmlns="http://sef.pt/">`,
    `<UnidadeHoteleira>${AIMA_NIPC}</UnidadeHoteleira>`,
    `<Estabelecimento>${AIMA_ESTAB}</Estabelecimento>`,
    `<ChaveAcesso>${AIMA_CHAVE}</ChaveAcesso>`,
    `<Boletins>${b64}</Boletins>`,
    `</EntregaBoletinsAlojamento></soap:Body>`,
    `</soap:Envelope>`,
  ].join('');

  console.log('[SOAP] Sending to:', AIMA_URL);
  console.log('[SOAP] NIPC:', AIMA_NIPC, '| ESTAB:', AIMA_ESTAB, '| CHAVE_LEN:', AIMA_CHAVE.length);

  const resp = await fetch(AIMA_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'text/xml; charset=utf-8', 'SOAPAction': '"http://sef.pt/EntregaBoletinsAlojamento"' },
    body: soap,
  });
  const raw = await resp.text();
  console.log('[SOAP] Response HTTP:', resp.status, '| Raw:', raw.substring(0, 300));

  const rMatch = raw.match(/<EntregaBoletinsAlojamentoResult[^>]*>([\s\S]*?)<\/EntregaBoletinsAlojamentoResult>/);
  const result = rMatch ? rMatch[1].trim() : null;
  if (result === '0') return { sucesso: true, raw };
  const dMatch = result?.match(/<Descricao[^>]*>([\s\S]*?)<\/Descricao>/);
  return { sucesso: false, erro: dMatch ? dMatch[1] : (result || 'Erro desconhecido'), raw };
}

async function signedUrl(fullUrl: string | null): Promise<string | null> {
  if (!fullUrl) return null;
  const base = `${SUPABASE_URL}/storage/v1/object/aima-documentos/`;
  if (!fullUrl.startsWith(base)) return null;
  const { data } = await supabase.storage.from('aima-documentos').createSignedUrl(fullUrl.slice(base.length), 3600);
  return data?.signedUrl || null;
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: cors });
  try {
    await verifyAdmin(req);
    const parts = new URL(req.url).pathname.split('/').filter(Boolean);
    const reservaId = parts[1];
    if (!reservaId) return new Response(JSON.stringify({ error: 'reservaId obrigatorio' }), { status: 400, headers: cors });

    const { data: reserva, error: rErr } = await supabase
      .from('Reserva')
      .select('id, data_check_in, data_check_out, status, numero_reserva, aima_dados_completos, hospede_id, Hospede:hospede_id(*), Quarto:quarto_id(nome)')
      .eq('id', reservaId).single();
    if (rErr || !reserva) return new Response(JSON.stringify({ error: 'Reserva nao encontrada' }), { status: 404, headers: cors });

    if (req.method === 'GET') {
      const { data: aimaHospedes } = await supabase.from('AimaHospede').select('*').eq('reserva_id', reservaId).order('ordem');
      const { data: logs } = await supabase.from('AimaLog').select('id, status, erro, criado_em, hospede_nome').eq('reserva_id', reservaId).order('criado_em', { ascending: false }).limit(10);
      let hospedesFinal = await Promise.all((aimaHospedes || []).map(async (h: Record<string, unknown>) => ({ ...h, documento_imagem_signed: await signedUrl(h.documento_imagem_url as string | null) })));
      if (hospedesFinal.length === 0 && reserva.Hospede) {
        const hp = reserva.Hospede as Record<string, unknown>;
        hospedesFinal = [{ ...hp, ordem: 1, documento_imagem_signed: await signedUrl(hp.documento_imagem_url as string | null) }];
      }
      const { data: configs } = await supabase.from('Configuracao').select('chave, valor');
      const cfg: Record<string, string> = {};
      for (const c of configs || []) cfg[(c as { chave: string; valor: string }).chave] = (c as { chave: string; valor: string }).valor;
      return new Response(JSON.stringify({
        status: 'success',
        reserva: { id: reserva.id, numero_reserva: reserva.numero_reserva, data_check_in: reserva.data_check_in, data_check_out: reserva.data_check_out, aima_dados_completos: reserva.aima_dados_completos, quartoNome: (reserva.Quarto as { nome: string } | null)?.nome },
        hospedes: hospedesFinal, logs: logs || [], config: cfg,
      }), { headers: cors });
    }

    if (req.method === 'POST') {
      if (!AIMA_CHAVE) return new Response(JSON.stringify({ error: 'AIMA_CHAVE_ACESSO nao configurada.' }), { status: 500, headers: cors });

      const { data: aimaHospedes } = await supabase.from('AimaHospede').select('*').eq('reserva_id', reservaId).order('ordem');
      let hospedes: Record<string, string>[] = (aimaHospedes || []) as unknown as Record<string, string>[];
      if (hospedes.length === 0 && reserva.Hospede) hospedes = [reserva.Hospede as unknown as Record<string, string>];
      if (hospedes.length === 0 || !hospedes[0].numero_documento)
        return new Response(JSON.stringify({ error: 'Dados dos hospedes incompletos. O formulario AIMA ainda nao foi preenchido.' }), { status: 422, headers: cors });

      const { data: configs } = await supabase.from('Configuracao').select('chave, valor');
      const cfg: Record<string, string> = {};
      for (const c of configs || []) cfg[(c as { chave: string; valor: string }).chave] = (c as { chave: string; valor: string }).valor;

      const xml = buildXML(hospedes, reserva as unknown as Record<string, string>, cfg);
      const resultado = await sendSOAP(xml);

      const nomeHospede = `${hospedes[0].nome || ''} ${hospedes[0].sobrenome || ''}`.trim();
      await supabase.from('AimaLog').insert({
        id: crypto.randomUUID(), reserva_id: reservaId, hospede_nome: nomeHospede,
        status: resultado.sucesso ? 'SUCESSO' : 'ERRO',
        erro: resultado.erro || null, payload_xml: xml, resposta_xml: resultado.raw,
      });

      if (resultado.sucesso)
        return new Response(JSON.stringify({ status: 'success', message: `Boletim enviado com sucesso para a AIMA! (${hospedes.length} hospede${hospedes.length > 1 ? 's' : ''})` }), { headers: cors });
      return new Response(JSON.stringify({ status: 'error', error: resultado.erro || 'Erro desconhecido retornado pela AIMA.' }), { status: 422, headers: cors });
    }

    return new Response(JSON.stringify({ error: 'Metodo nao suportado' }), { status: 405, headers: cors });
  } catch (e: unknown) {
    const err = e as { statusCode?: number; message?: string };
    return new Response(JSON.stringify({ error: err.message || 'Erro interno' }), { status: err.statusCode || 500, headers: cors });
  }
});
