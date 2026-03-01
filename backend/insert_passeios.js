require('dotenv').config();
const supabase = require('./src/config/supabase');
const crypto = require('crypto');

const passeios = [
    {
        nome: 'Castelo de Ourém', dist: '10 min', img: 'https://turismo.ourem.pt/wp-content/uploads/2023/07/castelo-medieval-ourem-768x384.jpg', desc: 'Um dos mais belos castelos medievais com vista panorâmica da região.',
        historia: 'Erguido no século XII, o Castelo de Ourém domina o topo de uma colina oferecendo vistas deslumbrantes sobre os vales circundantes. Durante séculos serviu como ponto de defesa crucial durante a Reconquista Cristã. A vila medieval amuralhada que o rodeia, com as suas ruas calcetadas e atmosfera histórica, transporta os visitantes para uma verdadeira viagem no tempo. Reza a lenda que a cidade foi batizada em homenagem a Fátima, uma princesa moura que se converteu ao cristianismo após se apaixonar por um cavaleiro cristão, adotando o nome de Oureana.'
    },
    {
        nome: 'Santuário de Fátima', dist: '15 min', img: 'https://images.unsplash.com/photo-1627933189870-071a9e32ff09?q=80&w=1000&auto=format&fit=crop', desc: 'O maior centro de peregrinação católica de Portugal, conhecido mundialmente.',
        historia: 'Conhecido globalmente, o Santuário de Fátima é um dos mais importantes locais de peregrinação católica do mundo. Foi neste local, na Cova da Iria, que em 1917 os três pastorinhos (Lúcia, Francisco e Jacinta) relataram as aparições da Virgem Maria. Ao longo do ano, especialmente nos dias 13 de maio e 13 de outubro, milhões de fiéis reúnem-se na gigantesca praça frente à Basílica de Nossa Senhora do Rosário numa imensa e comovente procissão de velas, num ambiente de fé, paz e profunda reflexão.'
    },
    {
        nome: 'Convento de Cristo (Tomar)', dist: '25 min', img: 'https://images.unsplash.com/photo-1517400508447-f8dd518b86e3?q=80&w=1000&auto=format&fit=crop', desc: 'Patrimônio Mundial da UNESCO e antiga sede mística dos Cavaleiros Templários.',
        historia: 'Classificado como Património Mundial pela UNESCO em 1983, o impressionante Convento de Cristo em Tomar foi originalmente a fortaleza e a sede matriz da misteriosa Ordem dos Cavaleiros Templários em Portugal no século XII. O monumento é uma obra-prima que mistura diferentes estilos arquitetónicos: o românico templário, o gótico inicial, o renascimento e a famosa janela do estilo manuelino. Andar por seus claustros e entrar na Charola (o oratório octogonal) é adentrar uma das maiores relíquias de toda a Europa.'
    },
    {
        nome: 'Praia Fluvial do Agroal', dist: '20 min', img: 'https://images.unsplash.com/photo-1505322022379-7c3353ee6291?q=80&w=1000&auto=format&fit=crop', desc: 'Piscinas naturais com águas cristalinas e terapêuticas na nascente do Rio Nabão.',
        historia: 'Aninhada no maior aquífero kárstico do país, a Praia Fluvial do Agroal é um verdadeiro oásis de natureza selvagem. Formada na impressionante nascente do Rio Nabão, dispõe de uma piscina biológica e águas correntes incrivelmente geladas e cristalinas durante o Verão inteiro. A sua água, proveniente de grandes profundidades da rocha vulcânica, tem forte fama de conter propriedades minerais terapêuticas, sendo popular há décadas por ajudar no tratamento de doenças de pele e do foro gastrointestinal.'
    },
    {
        nome: 'Mosteiro da Batalha', dist: '30 min', img: 'https://images.unsplash.com/photo-1558368529-6534d0bfe45f?q=80&w=1000&auto=format&fit=crop', desc: 'Gótico imponente e Patrimônio Mundial, símbolo da independência portuguesa.',
        historia: 'O Mosteiro de Santa Maria da Vitória (vulgo Mosteiro da Batalha) é uma das obras mais imponentes do gótico e manuelino da Península Ibérica. Foi mandado edificar pelo rei D. João I em agradecimento à Virgem Maria pela vitória sobre os castelhanos na épica Batalha de Aljubarrota, em 1385, garantindo a independência de Portugal. Classificado como Património Mundial da Humanidade, destaca-se pelos ricos vitrais góticos coloridos, as famosas Capelas Imperfeitas (sem teto) e a intrincada arquitetura dos túmulos reais.'
    },
    {
        nome: 'Pegadas de Dinossáurios', dist: '25 min', img: 'https://images.unsplash.com/photo-1518002171953-a080ee817e1f?q=80&w=1000&auto=format&fit=crop', desc: 'Trilhos que conservam os maiores rastros de saurópodes já encontrados no mundo.',
        historia: 'Escondido na encosta da Serra de Aire está o Monumento Natural das Pegadas dos Dinossáurios, um verdadeiro tesouro paleontológico mundial de 175 milhões de anos (Período Jurássico Médio). Numa antiga laje calcária enorme (pedreira) de 40 mil metros quadrados, foram descobertos quilômetros de rastos deixados por Saurópodes gigantes herbívoros. O local possui um centro de interpretação, longas trilhas de caminhada entre as pegadas fossilizadas gigantes com até 1 metro de diâmetro e representações em tamanho real dessas magníficas feras!'
    },
    {
        nome: 'Grutas de Mira de Aire', dist: '35 min', img: 'https://images.unsplash.com/photo-1515444744559-7be63e160efe?q=80&w=1000&auto=format&fit=crop', desc: 'Uma maravilha subterrânea e as maiores grutas naturais calcárias de Portugal.',
        historia: 'Eleitas como uma das 7 Maravilhas Naturais de Portugal, as impressionantes Grutas de Mira de Aire são as maiores cavidades subterrâneas abertas ao público do país. A visita guiada adentra as entranhas frias da terra até mais de 110 metros de profundidade! No trajeto imensamente iluminado descobrirá espetaculares formações calcárias de estalactites e estalagmites com nomes divertidos (Medusa, Órgão, Joia da Mantiqueira), finalizando numa galeria colossal aos pés de um rio subterrâneo enigmático. O local dispõe ainda de um resort de água sazonal.'
    },
    {
        nome: 'Aqueduto dos Pegões', dist: '25 min', img: 'https://images.unsplash.com/photo-1516084439075-842279c09ef9?q=80&w=1000&auto=format&fit=crop', desc: 'Enorme e majestosa obra arquitetônica que levava água ao castelo de Tomar.',
        historia: 'Esta obra colossal do século XVI é um esplendoroso aqueduto de seis quilómetros de extensão criado por Filippo Terzi (o mesmo arquiteto de El Escorial). O seu propósito era abastecer exclusivamente de água fresca as fontes e lavabos sumptuosos do Convento de Cristo. A parte mais monumental do aqueduto situa-se no Vale dos Pegões Altos, onde o conjunto de 180 imponentes arcos duplos e inteiramente de pedra se eleva a espantosos 30 metros acima do leito selvagem, criando a ilusão fantástica de uma fortaleza a rasgar o horizonte azul e verde profundo.'
    },
    {
        nome: 'Serras de Aire e Candeeiros', dist: '30 min', img: 'https://images.unsplash.com/photo-1469334031218-e382a71b716b?q=80&w=1000&auto=format&fit=crop', desc: 'Parque Natural preservado para realizar agradáveis trilhas (hiking) e fotografia.',
        historia: 'Este vasto e sereno Parque Natural Maciço Calcário Estremenho abrange uma superfície de centenas de quilómetros, sendo famoso pela aridez mítica da sua vegetação à superfície em brutal contraste com a imensa riqueza das suas bacias e rios todos a circular invisivelmente por debaixo da terra! A paisagem de rochas modeladas naturalmente pela chuva lembra frequentemente superfícies lunares. Ideal para explorar a flora, fazer hiking (caminhadas) e bird-watching. No topo de algumas serrações, há dezenas de impressionantes "moinhos de vento" tradicionais a adornar o topo das montanhas.'
    },
    {
        nome: 'Pia do Urso', dist: '35 min', img: 'https://images.unsplash.com/photo-1601614742617-57ceb10c2266?q=80&w=1000&auto=format&fit=crop', desc: 'Aldeia típica de pedra, tranquilidade e lar do primeiro parque ecossensorial.',
        historia: 'A mágica Ecoparque e Aldeia da Pia do Urso não é apenas uma requalificada típica aldeia rural de casas em pedra, barrocos e sobreiros. Trata-se do pioneiro ecoparque sensorial inteiramente projetado para invisuais e totalmente acessível de Portugal! Ao passear lentamente por frondosas sombras de carvalhos, pode-se escutar variadas estações de áudio interativas sobre a vida natural da montanha. O próprio nome intrigante "Pia do Urso" conta a lenda antiga na qual vastos e extintos ursos desciam das serranias escondidas em busca de poças naturais de água gelada gravadas nas rochas para beber.'
    }
];

async function run() {
    for (const p of passeios) {
        const { data, error } = await supabase.from('Passeio').select('id').eq('nome', p.nome).single();
        if (!data) {
            const id = crypto.randomUUID();
            await supabase.from('Passeio').insert([{ id, ...p, ativo: true }]);
            console.log(`Inserted: ${p.nome}`);
        } else {
            console.log(`Already exists: ${p.nome}`);
        }
    }
}

run();
