# 📋 Guia de Logging e Email Templates - Fase 3

## 🎯 Resumo da Implementação

Nesta fase (MÉDIO), implementamos:
- ✅ **Sistema de Logging Estruturado** com Winston e 5 transports
- ✅ **Templates de Email Profissionais** com Handlebars (5 templates)
- ✅ **Integração Completa** nos serviços de autenticação
- ✅ **100% de Cobertura de Testes** (59/59 testes passando)

---

## 📊 Logger Service

### Localização
`src/common/logger/logger.service.ts`

### Características
- **5 Transports Winston**:
  - `console`: Output colorido para desenvolvimento
  - `app.log`: Todos os logs (rotação 5MB, 5 arquivos)
  - `error.log`: Apenas erros (rotação 5MB)
  - `auth.log`: Eventos de autenticação (10 arquivos)
  - `security.log`: Eventos de segurança (10 arquivos)

- **Implementa NestJS LoggerService Interface**:
  ```typescript
  log(message: string, context?: string)
  error(message: string, trace?: string, context?: string)
  warn(message: string, context?: string)
  debug(message: string, context?: string)
  ```

- **Métodos Especializados**:
  ```typescript
  logAuth(event: string, identifier: string, metadata?: object)
  logSecurity(event: string, type: string, metadata?: object)
  logOperation(operation: string, duration: number, metadata?: object)
  ```

### Uso

#### No AuthService:
```typescript
// Login bem-sucedido
this.logger.logAuth('AUTH_LOGIN_SUCCESS', user.email, {
  userId: user.id,
  username: user.username,
});

// Falha de segurança
this.logger.logSecurity('LOGIN_FAILED_INVALID_PASSWORD', 'invalid_password', {
  userId: user.id,
  email: user.email,
});

// Operação com timing
const start = Date.now();
// ... operação ...
this.logger.logOperation('password_hash', Date.now() - start);
```

#### Em Qualquer Serviço:
```typescript
constructor(private logger: CustomLoggerService) {}

// Uso básico
this.logger.log('Operação iniciada', 'MyService');
this.logger.error('Erro crítico', error.stack, 'MyService');
this.logger.warn('Aviso importante', 'MyService');
```

### Variáveis de Ambiente

```env
# Nível de log (default: info)
LOG_LEVEL=info  # error, warn, info, http, debug, verbose, silly
```

### Saída de Log Estruturada

```json
{
  "timestamp": "2024-01-15T10:30:45.123Z",
  "context": "AuthService",
  "level": "info",
  "message": "Usuário autenticado com sucesso",
  "userId": "123abc",
  "email": "user@example.com"
}
```

---

## 📧 Email Template Service

### Localização
- Serviço: `src/common/email/email-template.service.ts`
- Templates: `src/common/email/templates/*.hbs`

### Templates Disponíveis

#### 1. **welcome.hbs** - Boas-vindas
Enviado após verificação de email com sucesso

**Variáveis**:
```handlebars
{{name}}           # Nome do usuário
{{appName}}        # Nome da aplicação
{{actionUrl}}      # URL para o dashboard
{{supportEmail}}   # Email de suporte
{{supportUrl}}     # Link de suporte
{{privacyUrl}}     # Link de privacidade
{{termsUrl}}       # Link de termos
{{year}}           # Ano atual
```

#### 2. **verification.hbs** - Verificação de Email
Enviado durante o registro com código de verificação

**Variáveis**:
```handlebars
{{name}}              # Nome do usuário
{{verificationCode}}  # Código de 6 dígitos
{{verificationUrl}}   # Link de verificação
{{expiryTime}}        # Tempo de expiração (minutos)
{{email}}             # Email do usuário
```

#### 3. **password-reset.hbs** - Redefinição de Senha
Enviado quando usuário solicita reset de senha

**Variáveis**:
```handlebars
{{name}}       # Nome do usuário
{{resetUrl}}   # Link para redefinir senha
{{expiryTime}} # Tempo de expiração (1 hora)
{{email}}      # Email do usuário
```

#### 4. **two-fa.hbs** - Código 2FA
Enviado com código para autenticação em dois passos

**Variáveis**:
```handlebars
{{name}}      # Nome do usuário
{{code}}      # Código 2FA
{{expiryTime}}# Tempo de expiração (minutos)
{{email}}     # Email do usuário
```

#### 5. **email-change.hbs** - Confirmação de Mudança de Email
Enviado quando usuário solicita trocar email

**Variáveis**:
```handlebars
{{name}}              # Nome do usuário
{{email}}             # Email atual
{{newEmail}}          # Novo email
{{confirmationUrl}}   # Link de confirmação
{{expiryTime}}        # Tempo de expiração (24 horas)
```

### Uso no EmailService

```typescript
// Verificação
await this.emailService.sendVerificationEmail(
  email: string,
  code: string,
  name: string
);

// Boas-vindas
await this.emailService.sendWelcomeEmail(
  email: string,
  name: string
);

// Reset de Senha
await this.emailService.sendPasswordResetEmail(
  email: string,
  name: string,
  resetToken: string
);

// Código 2FA
await this.emailService.sendTwoFAEmail(
  email: string,
  name: string,
  code: string
);

// Confirmação de Mudança de Email
await this.emailService.sendEmailChangeConfirmation(
  email: string,
  name: string,
  newEmail: string,
  confirmationToken: string
);
```

### Renderização Direta

Se precisar renderizar um template sem enviar:

```typescript
const html = this.templateService.renderWelcome(
  'João Silva',
  'joao@example.com',
  'https://app.com/dashboard'
);
```

---

## 📁 Estrutura de Arquivos

```
src/
├── common/
│   ├── logger/
│   │   ├── logger.module.ts        # Módulo global
│   │   └── logger.service.ts       # Serviço Winston
│   └── email/
│       ├── email.module.ts         # Módulo de email
│       ├── email.service.ts        # Serviço de envio
│       ├── email-template.service.ts # Renderização Handlebars
│       └── templates/
│           ├── welcome.hbs
│           ├── verification.hbs
│           ├── password-reset.hbs
│           ├── two-fa.hbs
│           └── email-change.hbs
└── auth/
    └── auth.service.ts             # Com logging integrado
```

---

## 🔧 Variáveis de Ambiente Necessárias

```env
# Email SMTP
MAIL_HOST=localhost
MAIL_PORT=1025
MAIL_SECURE=false
MAIL_USER=
MAIL_PASS=
MAIL_FROM=noreply@cromometro.com

# Aplicação
APP_NAME=Cromometro
APP_URL=http://localhost:3000
SUPPORT_EMAIL=support@cromometro.com
SUPPORT_URL=https://support.cromometro.com
PRIVACY_URL=https://cromometro.com/privacy
TERMS_URL=https://cromometro.com/terms

# Logging
LOG_LEVEL=info
```

---

## 📍 Locais de Acesso aos Logs

### Console
```bash
npm run start:dev
# Saída colorida em tempo real
```

### Arquivos de Log
```bash
# Todos os logs
cat logs/app.log

# Apenas erros
cat logs/error.log

# Eventos de autenticação
cat logs/auth.log

# Eventos de segurança
cat logs/security.log
```

### Exemplo de Log Auth
```json
{
  "timestamp": "2024-01-15T10:30:45.123Z",
  "level": "info",
  "event": "AUTH_LOGIN_SUCCESS",
  "identifier": "joao@example.com",
  "userId": "123abc",
  "username": "joao",
  "context": "AuthService"
}
```

### Exemplo de Log Security
```json
{
  "timestamp": "2024-01-15T10:31:00.456Z",
  "level": "warn",
  "event": "LOGIN_FAILED_INVALID_PASSWORD",
  "type": "invalid_password",
  "userId": "456def",
  "email": "atacante@malicious.com",
  "context": "AuthService"
}
```

---

## 🎨 Customização de Templates

### Adicionar Novo Helper Handlebars

```typescript
// No email-template.service.ts
this.registerHelper('uppercase', (str) => str.toUpperCase());

// No template
{{uppercase name}} // "JOÃO SILVA"
```

### Modificar Template Existente

1. Editar o arquivo `.hbs` em `src/common/email/templates/`
2. O serviço carrega automaticamente na próxima execução
3. Testar com renderização direta:

```typescript
const html = this.templateService.renderVerification(
  'João',
  'joao@example.com',
  '123456',
  'https://...',
);
console.log(html); // Ver resultado
```

---

## 🧪 Testes

Todos os testes passam:
```bash
npm test
# Test Suites: 5 passed, 5 total
# Tests: 59 passed, 59 total
```

### Arquivos de Teste
- `src/auth/auth.service.spec.ts` - Testes de auth com logging
- Outros testes não foram modificados

---

## 🚀 Próximas Fases (Futuro)

- [ ] Email template previewer endpoint (admin)
- [ ] Email queue system (Bull/RabbitMQ)
- [ ] Log aggregation (ELK stack)
- [ ] Alertas para eventos críticos
- [ ] Dashboard de logs em tempo real

---

## 📝 Notas Importantes

1. **Logging de Senhas**: Nunca logueia senhas ou tokens!
2. **Retry Automático**: EmailService tenta 3 vezes antes de falhar
3. **Rotação de Logs**: Automática via Winston (5MB por arquivo)
4. **Handlebars Variáveis**: São case-sensitive `{{name}}` ≠ `{{Name}}`
5. **Módulo Global**: LoggerModule é global, disponível em todos os serviços

---

**Última atualização**: 15 de Janeiro 2025
**Status**: ✅ Completo e testado (100% - 59/59 testes)
