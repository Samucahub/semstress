# 🚀 Quick Start - Fase 3 (Logging + Email)

## ⚡ Resumo em 60 Segundos

✅ **Logging**: 5 transports Winston (console, app.log, error.log, auth.log, security.log)  
✅ **Emails**: 5 templates HTML com Handlebars (welcome, verify, reset, 2FA, email-change)  
✅ **Testes**: 59/59 passando ✅  
✅ **Build**: Sem erros  

---

## 📦 O que foi instalado

```bash
npm install winston handlebars nodemailer-html-to-text html-to-text
```

---

## 🔧 Como usar

### 1. Logging em qualquer serviço

```typescript
constructor(private logger: CustomLoggerService) {}

// Log básico
this.logger.log('Operação iniciada', 'MyService');

// Log de autenticação
this.logger.logAuth('AUTH_LOGIN_SUCCESS', email, { userId: user.id });

// Log de segurança
this.logger.logSecurity('LOGIN_FAILED', 'invalid_password', { userId: user.id });

// Log de operação com timing
const start = Date.now();
// ... operação ...
this.logger.logOperation('database_query', Date.now() - start);
```

### 2. Enviar emails

```typescript
constructor(private emailService: EmailService) {}

// Verificação
await this.emailService.sendVerificationEmail(email, code, name);

// Boas-vindas
await this.emailService.sendWelcomeEmail(email, name);

// Reset de senha
await this.emailService.sendPasswordResetEmail(email, name, token);

// 2FA
await this.emailService.sendTwoFAEmail(email, name, code);

// Mudança de email
await this.emailService.sendEmailChangeConfirmation(email, name, newEmail, token);
```

### 3. Renderizar templates manualmente

```typescript
constructor(private templateService: EmailTemplateService) {}

const html = this.templateService.renderWelcome(
  'João Silva',
  'joao@example.com',
  'https://app.com/dashboard'
);

console.log(html); // HTML renderizado com Handlebars compilado
```

---

## 📊 Ver Logs

```bash
# Terminal
tail -f logs/app.log        # Todos
tail -f logs/auth.log       # Autenticação
tail -f logs/security.log   # Segurança
tail -f logs/error.log      # Erros
```

---

## 🧪 Testar Emails Localmente

```bash
# 1. Inicie MailHog (fake SMTP server)
docker run -d --name mailhog -p 1025:1025 -p 8025:8025 mailhog/mailhog

# 2. Configure .env
MAIL_HOST=localhost
MAIL_PORT=1025

# 3. Inicie servidor
npm run start:dev

# 4. Acesse MailHog
http://localhost:8025
```

---

## 📧 Variáveis de Ambiente

```env
# SMTP
MAIL_HOST=localhost
MAIL_PORT=1025
MAIL_FROM=noreply@cromometro.com

# App
APP_NAME=Cromometro
APP_URL=http://localhost:3000

# Links nos emails
SUPPORT_EMAIL=support@cromometro.com
SUPPORT_URL=https://support.cromometro.com
PRIVACY_URL=https://cromometro.com/privacy
TERMS_URL=https://cromometro.com/terms

# Logging
LOG_LEVEL=info
```

---

## 📁 Estrutura de Diretórios

```
src/
├── common/
│   ├── logger/
│   │   ├── logger.module.ts
│   │   └── logger.service.ts
│   └── email/
│       ├── email.module.ts
│       ├── email.service.ts
│       ├── email-template.service.ts
│       └── templates/
│           ├── welcome.hbs
│           ├── verification.hbs
│           ├── password-reset.hbs
│           ├── two-fa.hbs
│           └── email-change.hbs
```

---

## 🎯 Eventos Logueados

### Auth Logs
- `REGISTER_INITIATED` - Novo registro
- `AUTH_LOGIN_SUCCESS` - Login bem-sucedido
- `LOGIN_INITIATED_AWAITING_VERIFICATION` - Await email verify
- `WELCOME_EMAIL_SENT` - Email enviado

### Security Logs
- `REGISTRATION_FAILED_USERNAME_EXISTS` - Username duplicado
- `REGISTRATION_FAILED_EMAIL_EXISTS` - Email duplicado
- `LOGIN_FAILED_INVALID_CREDENTIALS` - Credenciais inválidas
- `LOGIN_FAILED_INVALID_PASSWORD` - Senha errada
- `PASSWORD_RESET_EMAIL_SENT` - Email reset enviado
- `EMAIL_VERIFICATION_FAILED` - Falha no envio de verificação

---

## 🔐 Segurança

✅ Nunca logueia senhas ou tokens  
✅ Avisos visíveis nos emails  
✅ Retry automático (3 tentativas)  
✅ Logs estruturados para análise  
✅ Separação de logs por tipo (auth, security, error)  

---

## 📚 Documentação Completa

- `LOGGING_AND_EMAIL_GUIDE.md` - Guia detalhado
- `PHASE_3_SUMMARY.md` - Resumo da fase
- `EMAIL_TESTING_GUIDE.sh` - Guia de testes

---

## ✅ Testes

```bash
npm test
# PASS src/auth/auth.service.spec.ts
# PASS src/auth/refresh-token.service.spec.ts
# PASS src/app.controller.spec.ts
# PASS src/common/validators/strong-password.validator.spec.ts
# PASS src/common/middleware/rate-limit.middleware.spec.ts
#
# Test Suites: 5 passed, 5 total
# Tests: 59 passed, 59 total ✅
```

---

## 🚀 Próximos Passos

1. ✅ Fase 1: Rate Limiting + Tests
2. ✅ Fase 2: Refresh Tokens + Security Headers
3. ✅ Fase 3: Logging + Email Templates
4. ⏳ Fase 4: Email Preview + Dashboard (futuro)

---

**Criado em**: 15 Janeiro 2025  
**Status**: ✅ Completo (59/59 testes, 100%)  
**Próximo**: Implementação de features adicionais
