-- ==========================================
-- SCRIPT DE CRIAÇÃO DE TABELAS PARA CONTACTOS
-- ==========================================

-- 1. Tabela de Configurações (Contactos e Redes Sociais)
CREATE TABLE IF NOT EXISTS public."Configuracao" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    chave TEXT UNIQUE NOT NULL,
    valor TEXT,
    criado_em TIMESTAMPTZ DEFAULT NOW(),
    atualizado_em TIMESTAMPTZ DEFAULT NOW()
);

-- Habilitar RLS (Row Level Security)
ALTER TABLE public."Configuracao" ENABLE ROW LEVEL SECURITY;

-- Política: Qualquer pessoa pode ler as configurações (usado no site público)
DROP POLICY IF EXISTS "Permitir leitura pública" ON public."Configuracao";
CREATE POLICY "Permitir leitura pública" ON public."Configuracao" 
FOR SELECT USING (true);

-- Política: Apenas o Admin (service_role ou autenticado) pode alterar
DROP POLICY IF EXISTS "Permitir gestão pelo admin" ON public."Configuracao";
CREATE POLICY "Permitir gestão pelo admin" ON public."Configuracao" 
FOR ALL USING (auth.role() = 'authenticated');


-- 2. Tabela de Mensagens de Contacto (Formulário do site)
CREATE TABLE IF NOT EXISTS public."MensagemContato" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome TEXT NOT NULL,
    email TEXT NOT NULL,
    assunto TEXT,
    mensagem TEXT NOT NULL,
    lida BOOLEAN DEFAULT FALSE,
    criado_em TIMESTAMPTZ DEFAULT NOW()
);

-- Habilitar RLS
ALTER TABLE public."MensagemContato" ENABLE ROW LEVEL SECURITY;

-- Política: Qualquer pessoa pode enviar mensagens (INSERT)
DROP POLICY IF EXISTS "Permitir envio público" ON public."MensagemContato";
CREATE POLICY "Permitir envio público" ON public."MensagemContato" 
FOR INSERT WITH CHECK (true);

-- Política: Apenas o Admin pode ler e gerir as mensagens
DROP POLICY IF EXISTS "Permitir leitura pelo admin" ON public."MensagemContato";
CREATE POLICY "Permitir leitura pelo admin" ON public."MensagemContato" 
FOR ALL USING (auth.role() = 'authenticated');

-- ==========================================
-- DICA: Cole este script no Editor SQL do seu painel Supabase e execute.
-- ==========================================
