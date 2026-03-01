# 🆘 TROUBLESHOOTING RÁPIDO - PRODUCTION DEPLOYMENT

---

## ❌ Railway Issues

### Erro: "Build failed" ou "Deployment failed"

**Soluções:**
1. Vê Railway → Logs → procura "error"
2. Verifica se todas variáveis estão addas (pode faltar uma)
3. Tenta rebuild: Railway → Redeploy

**Comando teste local:**
```bash
npm run build && npm run start
```

---

### Erro: "Cannot connect to database"

**Causa**: PostgreSQL não iniciou ou password errado

**Solução:**
```bash
# Railway → Database → Logs
# Vê se há erros de inicialização

# Se Database não existe, Railway cria automático
# Pode demorar ~1 min
```

**Teste direto:**
```bash
# Copia DATABASE_URL de Railway
psql postgresql://user:pass@host:5432/db
```

---

### Erro: "Module not found" ou "Cannot find @prisma/client"

**Causa**: Prisma client não gerado

**Solução:**
1. Localmente:
```bash
npx prisma generate
git add -A && git commit -m "Generate Prisma client"
git push
```

2. Railway auto-redeploy

---

## ❌ Vercel Issues

### Erro: "Next.js build failed"

**Soluções:**
1. Vercel → Deployments → vê logs
2. Procura "error" ou "ERR"
3. Verifica se NEXT_PUBLIC_API_URL está correto

**Teste local:**
```bash
cd frontend
npm run build
```

---

### Erro: "NEXT_PUBLIC_API_URL undefined"

**Causa**: Variável não definida em Vercel

**Solução:**
```
Vercel → Settings → Environment Variables
→ Add:
   Name: NEXT_PUBLIC_API_URL
   Value: https://api.cromometro.tk
   (sem http, apenas https)
```

---

### Erro: "Deployment cancelling" ou timeout

**Causa**: Build demorou > 12h ou foi cancelada

**Solução:**
1. Vercel → Deployments → Re-deploy
2. Se persistir, verifica se há loops infinitos no código

---

## ❌ DNS/Domínio Issues

### Erro: "ERR_NAME_NOT_RESOLVED" ou "Cannot reach cromometro.tk"

**Causa**: DNS não propagou ainda

**Soluções:**
1. Freenom DNS pode demorar 1-24h
2. Testa com nslookup:
```bash
nslookup cromometro.tk
# Deve mostrar Vercel IPs
```

3. Limpa DNS cache (depende SO):
```bash
# macOS
dscacheutil -flushcache

# Linux
systemctl restart systemd-resolved

# Windows
ipconfig /flushdns
```

4. Aguarda mais tempo (até 24h para Freenom)

---

### Erro: "certificate error" ou "HTTPS não funciona"

**Causa**: SSL/TLS não ativado ou incorreto

**Solução:**
- Vercel auto-gera SSL (deve estar OK)
- Railway auto-gera SSL para custom domain
- Aguarda ~5 min após adicionar custom domain

**Teste:**
```bash
curl -I https://cromometro.tk
# Deve ter "200 OK" ou redirect
```

---

## ❌ Mailtrap Issues

### Erro: "SMTP connection failed" ou emails não enviam

**Causa**: Mailtrap token errado ou disabled

**Solução:**
1. Vai https://mailtrap.io/
2. Login → Inbox → Integration → SMTP
3. Verifica se "2FA Mode" está **OFF**
4. Copia exato o "Auth token" (sem espaços)
5. Cola em Railway → MAIL_PASS

---

### Emails vêm como "bounced" ou "rejected"

**Causa**: FROM email não whitelisted

**Soluções:**
```
Mailtrap → Inbox → Email Testing
→ Whitelisted Emails
→ Add: noreply@cromometro.tk

OU usa Railway email:
MAIL_FROM = noreply@cromometro.tk
```

---

### Email de registration não chegou

**Verificar:**
1. Mailtrap → Inbox → vê se está lá
2. Se não está:
   - Verifica Railway logs (erro ao enviar?)
   - Verifica MAIL_PASS está correto
   - Testa curl manual:
```bash
curl -X POST https://api.cromometro.tk/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "password": "Test123!"}'
```

3. Se responde com email enviado, mas não chega:
   - Problema é Mailtrap, não app

---

## ❌ Backend Issues

### Erro: "CORS error" no frontend

**Mensagem típica**: "Access to XMLHttpRequest has been blocked by CORS"

**Causa**: `CORS_ORIGINS` em Railway está errado

**Solução:**
```
Railway → Variables
CORS_ORIGINS = https://cromometro.tk
(sem trailing slash)

Redeploy
```

**Teste curl:**
```bash
curl -I -H "Origin: https://cromometro.tk" \
  https://api.cromometro.tk/monitoring/health
# Deve ter Access-Control-Allow-Origin header
```

---

### Erro: "401 Unauthorized" no login

**Causa**: Cookie não está siendo enviado ou token expirou

**Solução:**
1. Verifica se frontend tá a enviar `credentials: 'include'`
2. Verifica se browser tá a aceitar cookies (F12 → Application → Cookies)
3. Testa health check:
```bash
curl https://api.cromometro.tk/monitoring/health
# Deve responder sem auth
```

---

### Erro: "Database error" ou "Prisma error P1000"

**Solução:**
```bash
# Railway → Database → Logs
# Verifica se há "FATAL" errors

# Se PostgreSQL crashed:
# Railway → Redeploy

# Se migrations não correram:
# Railway → Shell (não disponível no free)
# Ou adiciona comando em build:
# npm run build && npx prisma migrate deploy
```

---

## ✅ TESTES RÁPIDOS PARA CONFIRMAR

### 1. Backend Health
```bash
curl https://api.cromometro.tk/monitoring/health
# Esperado: {"status":"ok","database":"connected","uptime":...}
```

### 2. Frontend Load
```bash
curl https://cromometro.tk
# Esperado: HTML com <title>Cromometro</title>
```

### 3. Admin Creation
```bash
curl -X POST https://api.cromometro.tk/auth/register-admin \
  -H "Content-Type: application/json" \
  -H "x-setup-key: Nt7ofbEEi/T/vbzO1mLZVuRaWAc0fozruvL0qwIIQ7I=" \
  -d '{"email": "test@example.com", "password": "Test123!", "name": "Test"}'
# Esperado: {"userId": "uuid", "role": "admin"}
```

### 4. Login Test
```bash
curl -X POST https://api.cromometro.tk/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "password": "Test123!"}'
# Esperado: {"userId": "uuid", "email": "test@example.com"}
# (+ Set-Cookie headers)
```

### 5. Email in Mailtrap
```
Mailtrap.io → Inbox
# Deve ver email de registration com código de verificação
```

---

## 🔧 LOGS QUE PROCURAR

### Railway Logs
```
✅ "Backend listening on port 3001"
✅ "SMTP connection verified"
✅ "Nest application successfully started"

❌ "Database connection refused"
❌ "Cannot find module"
❌ "Error:" (em geral)
```

### Vercel Logs
```
✅ "✓ Ready in Xms"
✅ "Compiled successfully"

❌ "error" ou "ERR_"
❌ "Cannot find module"
```

---

## 📞 SE NADA FUNCIONA

**Checklist final:**

1. ✅ Domínio registado? (Freenom console)
2. ✅ DNS propagado? (nslookup cromometro.tk)
3. ✅ Railway variáveis todas addas? (copy/paste .env.production)
4. ✅ Mailtrap token correto? (sem espaços)
5. ✅ Vercel NEXT_PUBLIC_API_URL correto?
6. ✅ Main branch do GitHub está updated?
7. ✅ Health checks respondem?
8. ✅ PostgreSQL iniciou em Railway?

Se tudo está ✅ e ainda há erro:
- Railway → Redeploy
- Vercel → Redeploy
- Aguarda 5 min
- Testa novamente

---

## 🆘 ÚLTIMO RECURSO

Se nada funciona:
1. Verifica todos logs (Railway + Vercel)
2. Copia error exato
3. Testa localmente:
```bash
cd /home/samu/cromometro
npm run start
```

4. Se funciona local mas não em prod:
   - Problema é variáveis de ambiente
   - Railway → Variables → verifica TODAS
   - Especialmente: DATABASE_URL, MAIL_PASS, JWT_SECRET

---

**Boa sorte! Se ficar stuck, avisa com o erro exato! 🚀**
