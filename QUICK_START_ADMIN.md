# 🎯 Cromometro - Começar Agora

## ⚡ Guia Rápido - 5 Minutos

### 1. **Servidor Backend**
```bash
npm start
# Servidor roda em http://localhost:3001
```

### 2. **Frontend**
Em outro terminal:
```bash
cd frontend
npm run dev
# Acesse http://localhost:3000
```

### 3. **Login**
Credenciais de teste criadas:
- **Username**: `admin2026`
- **Password**: `AdminPassword@2026!`

Ou criar novos:
```bash
npx ts-node create-admin.ts
```

## 🚨 Se Receber Erro 401

O servidor é a primeira coisa que precisa estar rodando!

```bash
# Verificar se está rodando
curl http://localhost:3001
# Deve retornar: Hello World!
```

Se receber erro, veja [LOGIN_401_FIX_GUIDE.md](./LOGIN_401_FIX_GUIDE.md)

## 📊 Painel Admin

Após login como admin:
1. Acesse `/admin`
2. 3 abas:
   - **Overview**: Estatísticas do sistema
   - **Utilizadores**: Gerir users
   - **Atividades**: Histórico de ações

## 🗄️ Banco de Dados

O PostgreSQL precisa estar rodando:
```bash
# Docker (se usar)
docker-compose up -d

# Ou PostgreSQL local
# certifique-se que DATABASE_URL está correto em .env
```

## 📁 Estrutura

```
cromometro/
├── src/              # Backend NestJS
├── frontend/         # Frontend Next.js
├── prisma/           # Schema do banco
└── .env              # Variáveis de ambiente
```

## 🔗 Links Úteis

- Login: http://localhost:3000/login
- Dashboard: http://localhost:3000/dashboard
- Admin Panel: http://localhost:3000/admin
- API Docs: [ADMIN_MONITORING_IMPROVEMENTS.md](./ADMIN_MONITORING_IMPROVEMENTS.md)

## 📖 Documentação Completa

- [LOGIN_401_FIX_GUIDE.md](./LOGIN_401_FIX_GUIDE.md) - Solução para erro 401
- [ADMIN_MONITORING_IMPROVEMENTS.md](./ADMIN_MONITORING_IMPROVEMENTS.md) - Detalhes do painel admin
- [README.md](./README.md) - Documentação geral

---

**Dúvidas?** Verifique que:
1. ✅ Servidor NestJS está rodando (porta 3001)
2. ✅ Frontend Next.js está rodando (porta 3000)
3. ✅ PostgreSQL está ativo
4. ✅ Token é enviado em cada requisição autenticada
