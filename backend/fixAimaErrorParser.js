const xml2js = require('xml2js');
async function test() {
    const xml = `<ErrosBA xmlns="http://www.sef.pt/BAws">
      <RetornoBA>
        <Linha>0</Linha>
        <Codigo_Retorno>51</Codigo_Retorno>
        <Descricao>Número de identificação fiscal inválido</Descricao>
      </RetornoBA>
    </ErrosBA>`;
    const parser = new xml2js.Parser({ explicitArray: false });
    const obj = await parser.parseStringPromise(xml);
    console.log(JSON.stringify(obj, null, 2));
}
test();
