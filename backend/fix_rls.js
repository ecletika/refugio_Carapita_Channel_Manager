const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
    await prisma.$executeRawUnsafe(`ALTER TABLE "Passeio" DISABLE ROW LEVEL SECURITY;`);
    await prisma.$executeRawUnsafe(`ALTER TABLE "Configuracao" DISABLE ROW LEVEL SECURITY;`);
    console.log("RLS disabled!");
}

run().catch(console.error).finally(() => prisma.$disconnect());
