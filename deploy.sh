#!/bin/bash

# =============================================
#   DEPLOY SCRIPT — Refúgio Carapita
#   Uso: carapita-deploy
# =============================================

PROJECT_DIR="/home/mauriciojunior/Desktop/Carapita"
PM2="/home/mauriciojunior/.npm-global/bin/pm2"

echo ""
echo "🏨 ============================================="
echo "    REFÚGIO CARAPITA — Iniciando Deploy..."
echo "================================================"
echo ""

# ---- BACKEND ----
echo "📦 [1/5] A instalar dependências do backend..."
cd "$PROJECT_DIR/backend"
npm install --silent

echo "🗄️  [2/5] A aplicar migrações da base de dados..."
npx prisma migrate deploy 2>/dev/null || npx prisma db push 2>/dev/null
mkdir -p uploads

echo "🔧 [3/5] A iniciar/reiniciar o backend..."
$PM2 delete carapita-backend 2>/dev/null
$PM2 start src/index.js --name carapita-backend

# ---- FRONTEND ----
echo "🎨 [4/5] A construir o frontend (pode demorar ~60s)..."
cd "$PROJECT_DIR/frontend"
npm install --silent
npm run build

if [ $? -ne 0 ]; then
    echo ""
    echo "❌ Erro no build do frontend! Verifique os erros acima."
    exit 1
fi

echo "🌐 [5/5] A iniciar/reiniciar o frontend..."
$PM2 delete carapita-frontend 2>/dev/null
$PM2 start "npm start" --name carapita-frontend

# Guardar estado do PM2 para reiniciar automaticamente
$PM2 save

# ---- STATUS FINAL ----
echo ""
echo "✅ ============================================="
echo "    DEPLOY CONCLUÍDO COM SUCESSO!"
echo "================================================"
echo ""
echo "  🌐 Site:      http://localhost:3000"
echo "  🔧 API:       http://localhost:5000/api/health"
echo "  📋 Admin:     http://localhost:3000/admin"
echo ""
$PM2 status
echo ""
