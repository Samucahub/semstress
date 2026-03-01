# 🔓 Como Aceder ao Painel Admin - Guia Simples

## ⚡ 3 Passos Apenas

### Passo 1️⃣: Certifique-se que o servidor está rodando
```bash
curl http://localhost:3001
```
Deve retornar: `Hello World!`

### Passo 2️⃣: Faça login em http://localhost:3000/login

**Credenciais:**
- **Username**: `admin2026`
- **Password**: `AdminPassword@2026!`

### Passo 3️⃣: Acesse o painel em http://localhost:3000/admin

---

## 📊 O Que Ver no Painel

### **Overview** 📈
- Total de utilizadores no sistema
- Total de tarefas e projetos
- Tempo registado
- Últimas atividades

### **Utilizadores** 👥
- Lista de todos os utilizadores
- Mudar role (USER ↔ ADMIN)
- Eliminar utilizadores

### **Atividades** 📝
- Timeline de tudo o que foi feito no sistema
- Quem fez o quê e quando

---

## 🆘 Se Receber Erro 401

**Problema**: `API Error (401): {}`

**Solução**: 
1. Servidor não está rodando
2. Execute: `npm start` na pasta raiz
3. Espere pelas mensagens de início
4. Experimente novamente

---

## 📚 Documentação Completa

- [SOLUTION_REPORT_401_ADMIN.md](./SOLUTION_REPORT_401_ADMIN.md) - Relatório técnico
- [ADMIN_MONITORING_IMPROVEMENTS.md](./ADMIN_MONITORING_IMPROVEMENTS.md) - Funcionalidades
- [LOGIN_401_FIX_GUIDE.md](./LOGIN_401_FIX_GUIDE.md) - Guia detalhado

---

**Pronto?** Acesse agora: http://localhost:3000/admin 🚀
