# 🔒 Checklist: Criar Utilizador Admin em Produção

## Pré-requisitos
- [ ] App deployed com `.env.production` configurado
- [ ] `ADMIN_SETUP_KEY` preenchido no `.env.production`
- [ ] Backend e frontend operacionais

---

## Passos (5 minutos)

### 1. Testar que a API está viva
```bash
curl https://api.cromometro.example.com/monitoring/health
# Resposta esperada: {"status":"ok", ...}
```

### 2. Criar utilizador admin
```bash
curl -X POST https://api.cromometro.example.com/auth/register-admin \
  -H "Content-Type: application/json" \
  -H "x-setup-key: Nt7ofbEEi/T/vbzO1mLZVuRaWAc0fozruvL0qwIIQ7I=" \
  -d '{
    "name": "Teu Nome",
    "username": "teuusername",
    "email": "teu@email.com",
    "password": "SenhaForte123!@#"
  }'
```

**Resposta esperada:**
```json
{
  "authenticated": true,
  "role": "ADMIN",
  "token_type": "Bearer",
  "expires_in": 86400,
  "user_id": "..."
}
```

### 3. Validar login do admin
Vai para `https://cromometro.example.com/login` e faz login com:
- Email: `teu@email.com`
- Password: `SenhaForte123!@#`

Deves entrar e ver role ADMIN no sidebar/dashboard.

---

## 4. **CRÍTICO**: Revogar chave de setup

Depois de criar o admin, **imediatamente**:

### Opção A: Mudar a chave (recomendado)
```bash
# Gerar nova chave
openssl rand -base64 32

# Substitui ADMIN_SETUP_KEY no .env.production
# Reinicia a app
```

### Opção B: Remover completamente
```bash
# Remove linha ADMIN_SETUP_KEY do .env.production
# Reinicia a app
```

---

## Validação final
- [ ] Admin criado e funciona login
- [ ] `ADMIN_SETUP_KEY` mudada ou removida
- [ ] Ninguém tem acesso ao valor antigo da chave
- [ ] `.env.production` não está commitado no Git

---

## Troubleshooting

**Erro: "Setup inválido"**
→ Verifica que o header `x-setup-key` tem o valor exato de `ADMIN_SETUP_KEY`

**Erro: "Username já está em uso"**
→ Usa username diferente ou limpa DB se for primeira instalação

**Erro: Password fraca**
→ Password precisa de:
- Mínimo 12 caracteres
- 1 maiúscula (A-Z)
- 1 minúscula (a-z)
- 1 número (0-9)
- 1 símbolo (!@#$%...)

---

## Nota de segurança

Esta chave (`ADMIN_SETUP_KEY`) é apenas para **bootstrapping inicial**.
Após criares o admin, ela **não deve** ter valor utilizável.

Se precisares criar outro admin no futuro, faz via:
1. Login como admin existente
2. Dashboard Admin → Criar utilizador
3. Atribui role ADMIN manualmente
