const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Start seeding...');

    // Criar Usuário Admin
    const adminSenha = await bcrypt.hash('123456', 10);
    const admin = await prisma.usuario.upsert({
        where: { email: 'admin@refugiocarapita.com' },
        update: {},
        create: {
            nome: 'Administrador Carapita',
            email: 'admin@refugiocarapita.com',
            senha_hash: adminSenha,
            role: 'ADMIN',
        },
    });

    console.log(`👤 Admin criado: ${admin.email}`);

    // Criar Quarto de Teste
    const quartoRefugio = await prisma.quarto.create({
        data: {
            nome: 'Suíte Master',
            tipo: 'SUITE',
            capacidade: 2,
            preco_base: 120.00,
            descricao: 'Quarto imersivo',
            ativo: true
        }
    });

    console.log(`🛏️ Quarto criado: ${quartoRefugio.nome}`);

    // Criar Extras de Teste
    await prisma.extra.createMany({
        data: [
            { nome: 'Pequeno-almoço Buffet', preco: 15.00, icone: 'Coffee' },
            { nome: 'Massagem Relaxante', preco: 60.00, icone: 'Sparkles' },
            { nome: 'Transfer Aeroporto', preco: 45.00, icone: 'Car' },
        ]
    });
    console.log('✨ Extras criados.');

    // Criar Canal SITE
    const canalSite = await prisma.canal.upsert({
        where: { id: 'canal-site-id' },
        update: {},
        create: { id: 'canal-site-id', nome_canal: 'SITE', comissao_percentual: 0 }
    });

    // Criar Hóspede de Exemplo
    const hospedeEx = await prisma.hospede.upsert({
        where: { email: 'hospede@exemplo.com' },
        update: {},
        create: {
            nome: 'João',
            sobrenome: 'Exemplo',
            email: 'hospede@exemplo.com',
            telefone: '912345678',
            pais: 'Portugal',
            cidade: 'Lisboa'
        }
    });

    // Criar Reservas de Exemplo para Relatórios
    await prisma.reserva.createMany({
        data: [
            {
                quarto_id: quartoRefugio.id,
                hospede_id: hospedeEx.id,
                canal_id: canalSite.id,
                data_check_in: new Date('2024-03-01'),
                data_check_out: new Date('2024-03-05'),
                valor_total: 480.00,
                status: 'CONFIRMADA'
            },
            {
                quarto_id: quartoRefugio.id,
                hospede_id: hospedeEx.id,
                canal_id: canalSite.id,
                data_check_in: new Date('2024-03-10'),
                data_check_out: new Date('2024-03-12'),
                valor_total: 240.00,
                status: 'CHECK_OUT'
            }
        ]
    });
    console.log('📅 Reservas criadas.');

    console.log('✅ Seeding complete.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
