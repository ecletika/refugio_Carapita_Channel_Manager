const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
    const tables = [
        'Usuario', 'Quarto', 'Hospede', 'Canal', 'Extra', 'Reserva', 
        'TarifaSazonal', 'Bloqueio', 'Passeio', 'Configuracao'
    ];

    for (const table of tables) {
        try {
            await prisma.$executeRawUnsafe(`ALTER TABLE "${table}" ALTER COLUMN id SET DEFAULT gen_random_uuid();`);
            console.log(`Fixed ${table}`);
        } catch (e) {
            console.error(`Error fixing ${table}:`, e.message);
        }
    }
}

run().catch(console.error).finally(() => prisma.$disconnect());
