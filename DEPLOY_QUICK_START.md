# ✅ DEPLOY PRODUCTION - QUICK CHECKLIST

## ORDEM EXATA (Segue isto passo-a-passo)

---

### PASSO 1: Registar Domínio (5 min)
```
[ ] Vai a https://www.freenom.com/
[ ] Procura "cromometro.tk"
[ ] Select 12 months → Checkout (grátis)
[ ] Email confirm → Done
```

---

### PASSO 2: Mailtrap Token (2 min)
```
[ ] Vai a https://mailtrap.io/
[ ] Login / Sign up
[ ] Inbox → Integration → SMTP
[ ] Copia o "Auth token" (linha "api: ...")
[ ] Anotá este token: ____________________
```

---

### PASSO 3: Deploy Backend Railway (10 min)

```
[ ] Vai a https://railway.app/
[ ] Click "New Project" → "Deploy from GitHub"
[ ] Seleciona "cromometro" repositório
[ ] Railway auto-cria PostgreSQL ✅
[ ] Aguarda ~2 min build termina
[ ] Copia URL Railway (algo: https://cromometro-prod-xxx.railway.app)
```

**Anotá URL Railway**: ____________________

---

### PASSO 4: Variáveis Railway
```
[ ] Railway → Project → Variables
[ ] Add cada uma destas (copia do .env.production):

NODE_ENV = production
JWT_SECRET = Cy7EKWUpjzn...
JWT_EXPIRES_IN = 24h
REFRESH_TOKEN_SECRET = z3yGA9k9D1...
REFRESH_TOKEN_EXPIRY_DAYS = 30
ADMIN_SETUP_KEY = Nt7ofbEEi...
FRONTEND_URL = https://cromometro.tk
CORS_ORIGINS = https://cromometro.tk
NEXT_PUBLIC_API_URL = https://api.cromometro.tk
MAIL_HOST = live.smtp.mailtrap.io
MAIL_PORT = 587
MAIL_SECURE = false
MAIL_USER = api
MAIL_PASS = [COLA O TOKEN DO MAILTRAP AQUI]
MAIL_FROM = noreply@cromometro.tk
SUPPORT_EMAIL = support@cromometro.tk
APP_NAME = Cromometro
LOG_LEVEL = warn

[ ] Deploy redeploy (automático)
[ ] Aguarda ~3 min
[ ] Testa em terminal:
    curl https://api.cromometro.tk/monitoring/health
    (Deve responder com {"status":"ok"})
```

---

### PASSO 5: Domínio Custom Railway
```
[ ] Railway → Settings → Add Custom Domain
[ ] Entra: api.cromometro.tk
[ ] Railway auto-gera SSL ✅
```

---

### PASSO 6: Deploy Frontend Vercel (5 min)
```
[ ] Vai a https://vercel.com/
[ ] Click "New Project"
[ ] "Import GitHub Repository" → cromometro
[ ] Vercel auto-detecta Next.js ✅
```

---

### PASSO 7: Variáveis Vercel
```
[ ] Vercel → Project → Settings → Environment Variables
[ ] Add:
    NEXT_PUBLIC_API_URL = https://api.cromometro.tk

[ ] Vercel auto-deploy ✅
[ ] Aguarda ~5 min build termina
```

---

### PASSO 8: Domínio Custom Vercel
```
[ ] Vercel → Settings → Domains
[ ] Add: cromometro.tk
[ ] Copia os nameservers que Vercel dá (ns1.vercel.com, etc)
```

---

### PASSO 9: Apontar DNS Freenom para Vercel
```
[ ] Freenom → Services → My Domains → cromometro.tk
[ ] "Manage Domain"
[ ] "Management Tools" → "Nameservers"
[ ] "Use custom nameservers"
[ ] Add os nameservers Vercel:
    ns1.vercel.com
    ns2.vercel.com
    (ou os que Vercel deu)
[ ] Save
[ ] Aguarda ~1h propogação DNS
```

---

### PASSO 10: Testes
```
[ ] Testa backend:
    curl https://api.cromometro.tk/monitoring/health

[ ] Testa frontend:
    Abre https://cromometro.tk em browser
    (Pode demorar se DNS não propagou, tenta em 1h)

[ ] Cria ADMIN (execute no terminal):
    curl -X POST https://api.cromometro.tk/auth/register-admin \
      -H "Content-Type: application/json" \
      -H "x-setup-key: Nt7ofbEEi/T/vbzO1mLZVuRaWAc0fozruvL0qwIIQ7I=" \
      -d '{
        "email": "teu-email@example.com",
        "password": "SenhaForte123!",
        "name": "Admin User"
      }'
    
    (Resposta esperada: {"userId": "...", "role": "admin"})

[ ] Verifica email em Mailtrap:
    https://mailtrap.io/ → vê email de registration
```

---

### PASSO 11: Final Checks
```
[ ] Login no https://cromometro.tk com admin
[ ] Cria um projeto
[ ] Cria um time entry
[ ] Vê relatórios
[ ] Tudo funciona? ✅ PROD READY!
```

---

## 🎯 Status Atual

| Item | Status |
|------|--------|
| .env.production atualizado | ✅ Feito |
| Guia completo | ✅ DEPLOY_PRODUCTION_GUIDE.md |
| Código pronto | ✅ Main branch |
| PostgreSQL migrations | ✅ 16 migrations |
| Secrets fortes | ✅ OpenSSL |

---

## ⏱️ Tempo Total Estimado: **45 min**

- Freenom: 5 min
- Mailtrap: 2 min
- Railway: 15 min (build + config)
- Vercel: 10 min (build + config)
- DNS Propagação: 10-60 min (paralelo)
- Testes: 5 min

---

## 🚀 Ready? Começa por PASSO 1 acima!

Se tiver erro em qualquer passo, avisas que eu ajudo. Boa sorte! 🎉
