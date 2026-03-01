# 🚀 Guia de Deploy em Produção - GRÁTIS

> Cromometro em produção com **Railway (Backend) + Vercel (Frontend) + Freenom (Domínio)**
> Custo total: **$0** (Railway $5/mês crédito grátis, Vercel grátis, Freenom grátis)

---

## 📋 Pré-requisitos

- ✅ GitHub account (Samucahub)
- ✅ .env.production configurado com cromometro.tk
- ✅ Mailtrap account (já tens, ou cria em mailtrap.io)
- ✅ Freenom account (registas grátis)

---

## FASE 1: Registar Domínio Grátis (Freenom)

### 1️⃣ Registo do Domínio

1. Vai para https://www.freenom.com/
2. Click em "Find a new free domain"
3. Procura "cromometro.tk"
4. Select 12 months (máximo grátis) → Continue
5. Sign up ou login com GitHub (mais fácil)
6. Escolhe checkout grátis
7. Ativa email e confirms
8. **Anotá**: `cromometro.tk` está registado! ✅

### 2️⃣ Pointing DNS para Railway/Vercel (depois)

- Vais voltar aqui após deploy Railway/Vercel
- Freenom → Services → My Domains → Manage Domain
- Nameservers ou A records: apontará para Railway backend

---

## FASE 2: Deploy Backend em Railway

### 1️⃣ Criar Projeto Railway

1. Vai para https://railway.app/
2. Click "Deploy Now"
3. Click "GitHub" → Connect GitHub (Samucahub)
4. Select repositório "cromometro"
5. Click "Deploy"
6. Railway auto-deteta que é NestJS + PostgreSQL ✅

### 2️⃣ Configurar Variáveis de Ambiente

Railway automatic:
- Cria PostgreSQL plugin
- Gera `DATABASE_URL` automático
- Expõe POSTGRES_USER, POSTGRES_PASSWORD

Tu adicionar em Railway dashboard (Project → Variables):

```
NODE_ENV=production
PORT=3001
JWT_SECRET=Cy7EKWUpjzn94pwRe+R9qhrmwxsyfLDA6gOBkQ2ROwZEvaZbqQI5eu63MjBM9zg4FDp2JsLx+ylL0f/u6YBg6g==
JWT_EXPIRES_IN=24h
REFRESH_TOKEN_SECRET=z3yGA9k9D1OWyXAJKmibPTn7e5xNaHnGUNnQ6/8vVCzk6Q0NpwaxzOllgh6rZaIkpOqi23In9fhY8ofMNODIkA==
REFRESH_TOKEN_EXPIRY_DAYS=30
ADMIN_SETUP_KEY=Nt7ofbEEi/T/vbzO1mLZVuRaWAc0fozruvL0qwIIQ7I=
FRONTEND_URL=https://cromometro.tk
CORS_ORIGINS=https://cromometro.tk
APP_URL=https://cromometro.tk
NEXT_PUBLIC_API_URL=https://api.cromometro.tk
MAIL_HOST=live.smtp.mailtrap.io
MAIL_PORT=587
MAIL_SECURE=false
MAIL_USER=api
MAIL_PASS=[TEM_AQUI_O_TOKEN_DO_MAILTRAP]
MAIL_FROM=noreply@cromometro.tk
SUPPORT_EMAIL=support@cromometro.tk
APP_NAME=Cromometro
LOG_LEVEL=warn
```

**Mailtrap Token**: 
- Vai para https://mailtrap.io/
- Inbox → Integration → SMTP
- Copia **Auth token** (linha que começa com "api")
- Paste em `MAIL_PASS`

### 3️⃣ Domínio Custom no Railway

1. Railway dashboard → Project → Settings
2. Click "Add Custom Domain"
3. Entra `api.cromometro.tk`
4. Railway gera SSL automático ✅
5. **Anotá URL Railway**: algo como `https://cromometro-production-xxxx.railway.app`

### 4️⃣ Deploy

1. Merge tudo para `main` branch
2. Railway auto-redeploy
3. Vê logs em Railway → Logs tab
4. Procura: `"Backend listening on http://localhost:3001"`
5. Quando vires que iniciou, testa:

```bash
curl https://api.cromometro.tk/monitoring/health
```

Esperado: `{"status":"ok","database":"connected","uptime":"..."`

---

## FASE 3: Deploy Frontend em Vercel

### 1️⃣ Criar Projeto Vercel

1. Vai para https://vercel.com/
2. Click "New Project"
3. Click "Import Git Repository"
4. Seleciona `Samucahub/cromometro`
5. **Framework**: Next.js (auto-detecta)
6. Vercel auto-configura tudo ✅

### 2️⃣ Configurar Variáveis de Ambiente

Em Vercel → Project Settings → Environment Variables:

```
NEXT_PUBLIC_API_URL=https://api.cromometro.tk
```

Isto é tudo que precisa de frontend (é público).

### 3️⃣ Domínio Custom Vercel

1. Vercel → Project Settings → Domains
2. Add Domain: `cromometro.tk`
3. Vercel gera nameservers
4. **IMPORTANTE**: Aponta Freenom DNS para Vercel (depois)

### 4️⃣ Deploy

1. Vercel auto-deploy quando pushas para `main`
2. Vê "Production" tab
3. Quando terminar, testa: `https://cromometro.tk`
4. Esperado: app abre normalmente

---

## FASE 4: Configurar DNS (Freenom → Railway + Vercel)

### Freenom Nameservers

1. Freenom → Services → My Domains → cromometro.tk
2. "Manage Domain"
3. Tab "Management Tools" → "Nameservers"
4. Escolhe "Use custom nameservers"
5. Aponta para Vercel nameservers (Vercel dá-te em Domain settings)

**OU** se prefires apenas Railway + ter frontend noutra domain:
- Railway: `api.cromometro.tk` → Railway
- Vercel: `cromometro.tk` → Vercel

Exemplo Vercel nameservers (varia por deployment):
```
ns1.vercel.com
ns2.vercel.com
```

---

## FASE 5: Testes em Produção

### 1️⃣ Health Checks

```bash
# Backend health
curl https://api.cromometro.tk/monitoring/health

# Frontend (deveria carregar página)
curl https://cromometro.tk
```

### 2️⃣ Criar Admin (CRÍTICO!)

```bash
# No terminal local, cria primeiro admin:

curl -X POST https://api.cromometro.tk/auth/register-admin \
  -H "Content-Type: application/json" \
  -H "x-setup-key: Nt7ofbEEi/T/vbzO1mLZVuRaWAc0fozruvL0qwIIQ7I=" \
  -d '{
    "email": "seu-email@example.com",
    "password": "SenhaForte123!",
    "name": "Admin User"
  }'

# Resposta esperada:
# {"userId": "uuid", "email": "...", "role": "admin", "message": "Admin criado"}
```

### 3️⃣ Testar Fluxos Principais

1. **Registro**: `https://cromometro.tk/register`
   - Entra email, password
   - Verifica email (Mailtrap: https://mailtrap.io → Inboxes → vê email)

2. **Login**: `https://cromometro.tk/login`
   - Entra credenciais
   - Verifica cookies (F12 → Application → Cookies)
   - Procura `access_token`, `refresh_token`

3. **Dashboard**: Clica em projeto, cria time entry
   - Verifica se salva em BD
   - Check em Railway logs não há errors

4. **Relatórios**: Testa `/reports` e `/reports/summary`

---

## FASE 6: Monitorar em Produção

### Railway Monitoring
- Railway → Project → Metrics
- Vê CPU, Memory, Network usage
- Logs → procura errors/warnings

### Vercel Monitoring
- Vercel → Project → Analytics
- Core Web Vitals
- Deployment logs

### Mailtrap Emails
- https://mailtrap.io/ → Inbox
- Vê todos os emails enviados (registration, password reset, 2FA)

---

## 🎯 Troubleshooting

### Erro: "CORS error" no frontend

**Causa**: `CORS_ORIGINS` em backend não tem domínio correto

**Fix**:
```bash
# Railway → Variables
CORS_ORIGINS=https://cromometro.tk

# Depois faz redeploy
```

### Erro: "Email not sending"

**Causa**: Mailtrap token errado ou email nãoativado

**Fix**:
1. Verifica token em https://mailtrap.io/settings/api
2. Verifica se "2FA mode" está OFF
3. Copy token exato (sem espaços)

### Erro: "Database connection refused"

**Causa**: Railway PostgreSQL não iniciou

**Fix**:
1. Railway → Project → Database → Logs
2. Se vazio, é normal (Railway demora ~30s)
3. Aguarda 1 minuto, testa health check novamente

### Erro: "Cannot find module @prisma/client"

**Causa**: Build não correu `npx prisma generate`

**Fix**:
1. Railway → Settings → Build Command
2. Garante que está: `npm run build`
3. Manualmente: `npx prisma generate` antes de commit

---

## 📊 Checklist Final

- [ ] Domínio registado: `cromometro.tk` (Freenom)
- [ ] Backend running em Railway: `https://api.cromometro.tk/monitoring/health` ✅
- [ ] Frontend running em Vercel: `https://cromometro.tk` ✅
- [ ] DNS apontado (Freenom → Vercel)
- [ ] Mailtrap configurado com token certo
- [ ] Admin criado via POST /auth/register-admin
- [ ] Email de registro chegou a Mailtrap
- [ ] Login funciona com httpOnly cookies
- [ ] Dashboard carrega projetos
- [ ] Time entries salvam em BD
- [ ] Relatórios geram corretamente
- [ ] Logs em Railway sem errors

---

## 🔒 Segurança em Produção

✅ **Já feito:**
- Helmet (CSP, HSTS, X-Frame-Options)
- Rate limiting
- JWT com secrets fortes
- httpOnly cookies (XSS protection)
- CORS restrito
- Structured logging (errors só em /admin)

⚠️ **Recomendado depois:**
1. Google OAuth (opcional, para 2FA extra)
2. SSL pinning no mobile (se tiveres app)
3. WAF Cloudflare (grátis, mas setup extra)
4. Backup automático (já está configurado em docker-compose.prod.yml)

---

## 💰 Costs Tracker

| Serviço | Plano | Custo |
|---------|-------|-------|
| Railway | Free tier + $5/mês crédito | $0 (tem crédito) |
| Vercel | Pro (estimas uso baixo) | $0 (free tier) |
| Freenom | .tk domain | $0 (grátis 12m) |
| Mailtrap | Free tier | $0 (até 100 e-mails/mês) |
| **TOTAL** | | **$0/mês** |

---

## 🆘 Suporte

Qualquer erro durante deploy:
1. Check Railway/Vercel logs
2. Verifica variáveis de ambiente (podem faltar)
3. Testa `curl https://api.cromometro.tk/` direto
4. Vê em Mailtrap → "Errors" se há emails bouncing

**Boa sorte! 🚀**
