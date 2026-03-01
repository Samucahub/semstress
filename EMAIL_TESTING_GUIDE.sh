#!/bin/bash
# Email Testing Guide - Cromometro
# Para testar os emails localmente, siga os passos abaixo

echo "🧪 Guia de Teste de Emails - Cromometro"
echo "========================================"
echo ""

# Verificar se o Node/NPM está disponível
if ! command -v npm &> /dev/null; then
    echo "❌ NPM não encontrado. Instale Node.js primeiro."
    exit 1
fi

# Passo 1: Verificar MailHog
echo "📧 Passo 1: Configurar MailHog (servidor SMTP fake)"
echo ""
echo "Opção A - Docker (recomendado):"
echo "  docker run -d --name mailhog -p 1025:1025 -p 8025:8025 mailhog/mailhog"
echo ""
echo "Opção B - Linux/Mac (com Go instalado):"
echo "  go get github.com/mailhog/MailHog"
echo "  MailHog"
echo ""
echo "Depois acesse: http://localhost:8025"
echo ""

# Passo 2: Variáveis de ambiente
echo "📋 Passo 2: Configurar .env"
echo ""
echo "Adicione estas linhas no seu .env:"
cat << 'EOF'
MAIL_HOST=localhost
MAIL_PORT=1025
MAIL_SECURE=false
MAIL_USER=
MAIL_PASS=
MAIL_FROM=noreply@cromometro.com
APP_NAME=Cromometro
APP_URL=http://localhost:3000
SUPPORT_EMAIL=support@cromometro.com
SUPPORT_URL=https://support.example.com
PRIVACY_URL=https://privacy.example.com
TERMS_URL=https://terms.example.com
EOF
echo ""

# Passo 3: Iniciar aplicação
echo "🚀 Passo 3: Iniciar o servidor"
echo "  npm run start:dev"
echo ""

# Passo 4: Testar endpoints
echo "🧪 Passo 4: Testar Endpoints"
echo ""
echo "4.1 - Registrar novo usuário:"
echo "  curl -X POST http://localhost:3001/auth/register \\"
echo '    -H "Content-Type: application/json" \\'
echo '    -d "{"username":"testuser","email":"test@example.com","password":"StrongPass123!","name":"Test User"}"'
echo ""

echo "4.2 - Verificar email enviado:"
echo "  Abra: http://localhost:8025"
echo "  Você verá o email de verificação"
echo ""

echo "4.3 - Obter código de verificação:"
echo "  No MailHog, copie o código de verificação (6 dígitos)"
echo ""

echo "4.4 - Verificar email:"
echo "  curl -X POST http://localhost:3001/auth/verify-email \\"
echo '    -H "Content-Type: application/json" \\'
echo '    -d "{"email":"test@example.com","code":"123456"}"'
echo ""

echo "✅ Agora você receberá um email de boas-vindas!"
echo ""

# Passo 5: Ver logs
echo "📊 Passo 5: Verificar Logs"
echo ""
echo "Console:"
echo "  npm run start:dev"
echo "  Você verá logs coloridos do Winston"
echo ""

echo "Arquivos de log:"
echo "  cat logs/app.log          # Todos os logs"
echo "  cat logs/auth.log         # Eventos de autenticação"
echo "  cat logs/error.log        # Apenas erros"
echo "  cat logs/security.log     # Eventos de segurança"
echo ""

# Passo 6: Testar renderização de templates
echo "🎨 Passo 6: Testar Renderização de Templates (Interativo)"
echo ""
echo "Crie um arquivo test-email.ts:"
cat << 'EOF'
import { EmailTemplateService } from './src/common/email/email-template.service';
import { CustomLoggerService } from './src/common/logger/logger.service';

const logger = new CustomLoggerService();
const templateService = new EmailTemplateService(logger);

// Renderizar welcome email
const welcomeHtml = templateService.renderWelcome(
  'João Silva',
  'joao@example.com',
  'https://localhost:3000/dashboard'
);

console.log('=== WELCOME EMAIL ===');
console.log(welcomeHtml);

// Renderizar verification email
const verificationHtml = templateService.renderVerification(
  'Maria Santos',
  'maria@example.com',
  '123456',
  'https://localhost:3000/verify-email?code=123456&email=maria@example.com'
);

console.log('\n=== VERIFICATION EMAIL ===');
console.log(verificationHtml);
EOF

echo "  npx ts-node test-email.ts"
echo ""

# Passo 7: Casos de teste
echo "📋 Passo 7: Casos de Teste"
echo ""
echo "✓ Registro com email válido"
echo "  - Deve enviar email de verificação"
echo "  - Deve criar PendingUser"
echo "  - Deve loguear REGISTER_INITIATED"
echo ""

echo "✓ Verificação de email"
echo "  - Deve converter PendingUser → User"
echo "  - Deve enviar email de boas-vindas"
echo "  - Deve inicializar statuses padrão"
echo ""

echo "✓ Login bem-sucedido"
echo "  - Deve loguear AUTH_LOGIN_SUCCESS"
echo "  - Deve retornar JWT + RefreshToken"
echo ""

echo "✓ Login falhado"
echo "  - Deve loguear LOGIN_FAILED_INVALID_PASSWORD"
echo "  - Deve ir para security.log"
echo ""

echo "✓ Retry de email"
echo "  - Se SMTP falhar, deve tentar 3 vezes"
echo "  - Com 5 segundos entre tentativas"
echo ""

# Resumo
echo ""
echo "=================="
echo "✅ Resumo de Testes"
echo "=================="
echo ""
echo "1. Inicie MailHog: docker run -d -p 1025:1025 -p 8025:8025 mailhog/mailhog"
echo "2. Configure .env com MAIL_HOST=localhost"
echo "3. Inicie servidor: npm run start:dev"
echo "4. Registre usuário: curl -X POST http://localhost:3001/auth/register ..."
echo "5. Acesse MailHog: http://localhost:8025"
echo "6. Verifique email: curl -X POST http://localhost:3001/auth/verify-email ..."
echo "7. Veja logs: tail -f logs/*.log"
echo ""
echo "🎉 Pronto para testar!"
