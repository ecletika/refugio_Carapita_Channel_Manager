const { Client } = require('pg');
require('dotenv').config();

const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function run() {
    try {
        await client.connect();

        await client.query(`
        CREATE TABLE IF NOT EXISTS "Cupom" (
            "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            "codigo" VARCHAR(255) UNIQUE NOT NULL,
            "tipo_desconto" VARCHAR(50) DEFAULT 'PERCENTUAL',
            "valor_desconto" NUMERIC(10, 2) NOT NULL,
            "limite_usos" INTEGER,
            "usos_atuais" INTEGER DEFAULT 0,
            "data_validade" TIMESTAMP,
            "ativo" BOOLEAN DEFAULT true,
            "criado_em" TIMESTAMP DEFAULT NOW()
        );
        `);

        // Enable RLS for Cupom
        await client.query(`ALTER TABLE "Cupom" ENABLE ROW LEVEL SECURITY;`);

        // Check if cupom_id exists on Reserva
        const { rows } = await client.query(`
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name='Reserva' and column_name='cupom_id';
        `);

        if (rows.length === 0) {
            await client.query(`ALTER TABLE "Reserva" ADD COLUMN "cupom_id" UUID REFERENCES "Cupom"("id") ON DELETE SET NULL;`);
        }

        console.log("Migração de cupons efetuada com sucesso!");
    } catch (e) {
        console.error(e);
    } finally {
        await client.end();
    }
}
run();
