# Guia de Deploy — Refúgio Carapita (Cloudflare)

Este guia detalha como colocar o projeto online utilizando a infraestrutura da **Cloudflare**.

## 1. Frontend (Next.js) — Cloudflare Pages

O Cloudflare Pages é a melhor opção para o frontend Next.js por ser rápido e gratuito.

### Passos:
1.  **Repositório:** Envie o código do seu projeto para o GitHub ou GitLab.
2.  **Dashboard Cloudflare:**
    *   Vá em **Workers & Pages** > **Create (Create application)** > **Pages** > **Connect to Git**.
    *   Selecione o seu repositório.
3.  **Configurações de Build:**
    *   **Project Name:** `refugio-carapita`
    *   **Framework Preset:** `Next.js`
    *   **Build Command:** `npm run build`
    *   **Build Output Directory:** `.next`
    *   **Root Directory:** `/frontend`
4.  **Variáveis de Ambiente (Environment Variables):**
    *   Clique em **Settings** > **Environment Variables** e adicione:
        *   `NEXT_PUBLIC_API_URL`: O endereço onde o seu **Backend** estará rodando (veja seção abaixo).
5.  **Build & Deploy:** Clique em "Save and Deploy".

---

## 2. Backend (Express.js) — Opções

O Cloudflare Pages/Workers é focado em "Serverless". Como o seu backend é um servidor **Express** tradicional, você tem duas opções:

### Opção A: Cloudflare Workers (Recomendado para Cloudflare total)
Para rodar no Cloudflare Workers, você precisará instalar o adaptador para Express:
1. Instalar dependência: `npm install @venomous/express-worker` (no diretório backend).
2. Adaptar o `index.js` para exportar a função de fetch do Worker.

### Opção B: Host Externo + Cloudflare (Mais simples para iniciantes)
Hospede o backend em um serviço como **Render.com**, **Railway.app** ou um **VPS**:
1. Faça o deploy no Render/Railway a partir do diretório `/backend`.
2. Configure as variáveis do `.env` no painel deles (`SUPABASE_URL`, `SUPABASE_ANON_KEY`, etc.).
3. Adicione o seu domínio da Cloudflare no painel do host escolhido.
4. Use a URL gerada por eles no `NEXT_PUBLIC_API_URL` do frontend.

---

## 3. Banco de Dados (Supabase)

Você já está integrado com o Supabase! Não precisa de deploy adicional para o banco de dados. Apenas garanta que:
1. As **Roles & Permissions** no Supabase permitam conexões do novo IP do servidor.
2. As URLs de redirecionamento de Auth (se usadas) incluam o seu domínio da Cloudflare.

## 4. Resumo de Variáveis de Ambiente Necessárias

### Para o Frontend:
- `NEXT_PUBLIC_API_URL`: URL da sua API (Backend).

### Para o Backend:
- `SUPABASE_URL`: Sua URL do Supabase.
- `SUPABASE_ANON_KEY`: Sua chave anônima.
- `SUPABASE_SERVICE_ROLE_KEY`: Sua chave de serviço (essencial para os bloqueios que configuramos).
- `JWT_SECRET`: Uma chave secreta para as sessões.
- `EMAIL_HOST`, `EMAIL_USER`, `EMAIL_PASS`: Para o envio de confirmações de reserva.

---

## Precisa de ajuda com o Git?
Se você ainda não enviou o código para o GitHub, eu posso gerar os comandos para você inicializar o repositório agora mesmo.
