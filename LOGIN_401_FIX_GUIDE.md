# 🔧 Guia de Solução - Erro 401 e Acesso ao Painel Admin

## ✅ Problema Resolvido

Você estava recebendo o erro `API Error (401): {}` porque:
1. **Servidor não estava rodando** - Sem o servidor, a chamada de login falhava
2. **Nenhum admin existia no sistema** - Mesmo que o servidor estivesse rodando, não havia credenciais de admin

## 🚀 Solução Aplicada

### 1. Servidor Backend
✅ Servidor NestJS está **rodando na porta 3001**
- Todos os endpoints estão funcionando corretamente
- Autenticação JWT está ativa
- Banco de dados PostgreSQL está sincronizado

### 2. Admin User Criado
✅ Um utilizador admin foi criado com as seguintes credenciais:

```
Username: admin2026
Email: admin2026@cromometro.local
Password: AdminPassword@2026!
Role: ADMIN
Email Verificado: ✅ Sim
```

## 📝 Como Acessar o Painel Admin

### 1. **Fazer Login**
- Acesse: `http://localhost:3000/login`
- Use as credenciais acima:
  - **Email ou Username**: `admin2026`
  - **Password**: `AdminPassword@2026!`

### 2. **Ir para o Painel Admin**
- Após login bem-sucedido, você será redirecionado para `/dashboard`
- Clique em **"Admin"** na barra lateral esquerda
- Ou acesse direto: `http://localhost:3000/admin`

## 📊 O Que Pode Fazer no Painel Admin

### **Tab 1: Overview (Estatísticas)**
- 📈 Ver estatísticas do sistema em tempo real:
  - Total de utilizadores
  - Total de admins e utilizadores normais
  - Total de projetos e tarefas
  - Tempo total registado
  - Novos utilizadores esta semana
  
- 📝 Feed de últimas atividades do sistema

### **Tab 2: Utilizadores**
- 👥 Tabela completa de utilizadores
- 📋 Informações: nome, email, username, role, data de criação
- ✏️ Mudar role (USER ↔ ADMIN) em tempo real
- 🗑️ Eliminar utilizadores com confirmação de segurança

### **Tab 3: Atividades**
- 📊 Histórico completo de ações no sistema
- 🔍 Ver quem fez o quê e quando
- 📅 Timestamps formatados em português

## 🔒 Segurança

- Apenas utilizadores com role **ADMIN** podem aceder ao painel
- Se não for admin, será redirecionado para login
- Não pode alterar o seu próprio role ou eliminar a sua própria conta
- Todas as ações são registadas no sistema de auditoria

## 🐛 Se Receber Erro 401 Novamente

### Verificar:
1. ✅ Servidor está rodando?
   ```bash
   curl http://localhost:3001
   ```
   Deve retornar: `Hello World!`

2. ✅ Credenciais estão corretas?
   - Username: `admin2026` (exato, sem espaços)
   - Password: `AdminPassword@2026!` (sensível a maiúsculas/minúsculas)

3. ✅ Token está guardado no navegador?
   - Abra DevTools (F12)
   - Vá para Storage > Local Storage > localhost:3000
   - Procure pela chave `token` e `role`

### Se Ainda Não Funcionar:
1. Limpe o local storage:
   ```javascript
   // No DevTools Console
   localStorage.clear();
   location.reload();
   ```

2. Faça login novamente com as credenciais

3. Verifique o console do browser para mensagens de erro detalhadas

## 🆚 Teste Rápido via API

Para testar o login diretamente:

```bash
curl -X POST http://localhost:3001/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin2026",
    "password": "AdminPassword@2026!"
  }'
```

**Resposta esperada** (com access_token):
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIs...",
  "refresh_token": "eyJhbGciOiJIUzI1NiIs...",
  "token_type": "Bearer",
  "expires_in": 86400,
  "role": "ADMIN"
}
```

## 📚 Documentação Completa

Para mais detalhes sobre as novas funcionalidades do painel admin, veja:
- [ADMIN_MONITORING_IMPROVEMENTS.md](./ADMIN_MONITORING_IMPROVEMENTS.md)

---

**Status**: ✅ Sistema funcionando corretamente
**Servidor**: http://localhost:3001
**Frontend**: http://localhost:3000
**Data**: 27 de Fevereiro de 2026
