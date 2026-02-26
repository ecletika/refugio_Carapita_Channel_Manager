# 🏨 Sistema de Gestão Hoteleira - Refúgio Carapita

Este documento contém toda a análise arquitetural, o modelo de banco de dados, fluxos de integração e o plano detalhado de criação do seu PMS (Property Management System) + Site Oficial.

---

## 🔗 1. Arquitetura de Integração (Diagrama)

```text
       [Hóspedes]                                [Administradores]
           |                                             |
  +------------------+                          +------------------+
  | Site Oficial     |                          | Painel Admin     |
  | (Frontend - Web) |                          | (Channel Manager)|
  +--------+---------+                          +--------+---------+
           |                                             |
           +----------------------+----------------------+
                                  |
                        +---------+---------+
                        |  API REST Central |
                        | (Backend Node.js) |
                        +---------+---------+
                                  |
         +------------------------+------------------------+
         |                        |                        |
 +----------------+      +------------------+     +------------------+
 | Banco de Dados |      | Booking.com API  |     | Airbnb API       |
 | (PostgreSQL)   |      | (ou Webhooks/iCal|     | (ou Webhooks/iCal|
 +----------------+      +------------------+     +------------------+
         |
 +----------------+
 | Filas (Redis)  | (Garante processamento seguro de 
 +----------------+  pedidos simultâneos de reserva)
```
**Como funciona centralizado:**
- Qualquer solicitação de reserva (seja pelo site web ou por webhook de um OTA como Booking), passa pela `API REST Central`.
- A API verifica o `Banco de Dados` usando uma transação com _Lock_ para garantir que ninguém mais reservou os mesmos dias.
- Assim que aprovado e inserido no Banco, a API dispara eventos (via Redis/Filas) assinados para atualizar o Airbnb e Booking com as novas datas bloqueadas.

---

## 🗄️ 2. Modelo de Banco de Dados (PostgreSQL)

Aqui estão as tabelas essenciais para um hotel.

### Tabelas Core
- **`usuarios`**: `id, nome, email, senha_hash, role (ADMIN, RECEPCAO)`
- **`quartos`**: `id, nome, tipo, capacidade, preco_base, descricao, fotos (json), ativo`
- **`hospedes`**: `id, nome, email, telefone, nif, passaporte`
- **`canais`**: `id, nome_canal (SITE, BOOKING, AIRBNB), comissao_percentual`

### Tabelas de Transação (Onde a mágica acontece)
- **`reservas`**: 
  - `id, quarto_id, hospede_id, canal_id`
  - `status (PENDENTE, CONFIRMADA, CANCELADA, CHECK_IN, CHECK_OUT)`
  - `data_check_in, data_check_out`
  - `valor_total, codigo_reserva_externo`
  - `data_criacao`
- **`tarifas_sazonais`**: `id, quarto_id, data_inicio, data_fim, preco_noite`
- **`bloqueios`** (Para manutenções): `id, quarto_id, data_inicio, data_fim, motivo`

---

## ⏱️ 3. Plano de Desenvolvimento (Fases e Tempos)

- **Fase 1: Configuração e Infra (1 a 2 semanas)**
  - Criação do banco, scripts de migração, infra base e setup inicial do Site com identidade de marca.
  - _Stack:_ Node, Express, Next.js, PostgreSQL local.
- **Fase 2: Site e Motor de Reserva (Frontend) (2 semanas)**
  - Criação das telas Home, Quartos, Galeria e o _Motor de Busca de Disponibilidade_. 
  - Conexão do checkout ao Stripe para obter Cartão de Crédito real de forma segura.
- **Fase 3: Channel Manager Core (2 semanas)**
  - Telas do painel admin: Calendário Visual em Grade, Gestão de Quartos e Tarifas, Relatórios e Dashboard Geral.
- **Fase 4: Integrações OTA (Booking / Airbnb) (3 a 4 semanas)**
  - Implementação robusta das APIs de Connectivity, mapeamento de Webhooks, gestão e fallback para ficheiros iCal (.ics).

**Total estimado:** ~ 2 a 3 meses de desenvolvimento focado.

---

## 🔑 4. APIs e Credenciais que Precisará Solicitar

Para que o backend consiga dialogar diretamente para fechar quartos no momento em que alguém faz reserva, você precisa de:

1. **Stripe (Pagamentos):**
   - Chaves: `Publishable Key` e `Secret Key`.
   - Pode abrir conta imediatamente. Usada para pegar cartão de crédito e fazer pagamentos no site direto.
2. **Booking.com Connectivity API:**
   - Link: _https://connectivity.booking.com/_
   - Como provedor de software (e não apenas anfitrião), você deverá solicitar uma parceria como "Connectivity Partner" ou Provider. 
   - _Nota:_ Na ausência temporária de aprovação (demora semanas), usaremos a configuração de exportação de um link `.ics` (iCal), que o próprio booking lê 1x por hora, embora menos "tempo real" que os webhooks da API direta.
3. **Airbnb API for Software Partners:**
   - Link: _https://www.airbnb.com/partner_
   - Mesmo processo. O Airbnb permite chaves OAuth OAuth2 e webhooks em tempo real caso tenha a parceria aprovada. Se não, o padrão recai sobre `.ics`.

---

## 🚀 5. Instruções de Deploy (Foco no Mais Simples/Hospedagens Citadas)

Dado que o projeto preza por não exigir "equipe técnica" complexa:

1. **Frontend (Site Oficial):** Render, Vercel ou **Cloudflare Pages**.
   - **Como:** Conecte o repositório GitHub ao painel do Vercel/Cloudflare e selecione Next.js. O deploy ocorrerá em segundos nas redes de ponta (CDN). Custo inicial: _Grátis_.
2. **Backend (API + Channel Manager):** **Railway.app** ou Render.
   - **Como:** O Railway permite adicionar ao projeto um "Postgres" com um clique e dar deploy na app Node.js conectada. Oferece TLS automático e escalabilidade de contêineres super fácil.
3. **Banco de Dados (PostgreSQL):** Gerenciado dentro do Railway ou Supabase.

---
**Código Básico:**
Geramos na pasta seu setup inicial de backend (Node JS) com as rotas que foram pedidas `(Sincronizar, Disponibilidade, etc)`. E no `frontend` a Home estante com as cores oficiais e Layout padrão Tailwind moderno.
