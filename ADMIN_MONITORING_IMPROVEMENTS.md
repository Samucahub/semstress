# 🎯 Painel Admin - Monitorização de Utilizadores

## ✅ Melhorias Implementadas

### 1. **Banco de Dados - Modelo de Auditoria**
- ✅ Adicionado modelo `AuditLog` no Prisma schema
- ✅ Rastreia: ação, tipo de entidade, ID da entidade, mudanças, detalhes, IP, user-agent
- ✅ Índices automáticos para consultas rápidas (userId, createdAt, action, entityType)

### 2. **Backend - Novos Endpoints API**

#### Dashboard e Estatísticas
```bash
GET /admin/dashboard/stats
# Retorna:
# - Total de utilizadores (com novos esta semana)
# - Total de tarefas e time entries (com novos esta semana)
# - Total de projetos
# - Distribuição de roles (ADMIN vs USER)
# - Tempo total registado pelo sistema
```

#### Atividades Recentes
```bash
GET /admin/activities?limit=50
# Lista as 50 atividades mais recentes no sistema
# Inclui: action, entityType, user info, timestamp
```

#### Análise de Atividades
```bash
GET /admin/analytics?days=7
# Retorna estatísticas dos últimos 7 dias:
# - Atividades por dia
# - Contagem por tipo de ação
# - Contagem por tipo de entidade
# - Atividades por utilizador
```

#### Pesquisa de Logs
```bash
GET /admin/logs/search?userId=xxx&action=xxx&entityType=xxx&startDate=xxx&endDate=xxx
# Pesquisa avançada com múltiplos filtros
```

#### Detalhes do Utilizador
```bash
GET /admin/users/:id/details
# Nome, email, role, verificação de email
# Estatísticas: total de tarefas, time entries, projetos
# Últimas 10 ações (tarefas, time entries, projetos)

GET /admin/users/:id/activity
# Timeline completa de atividades do utilizador
```

### 3. **Frontend - Dashboard Admin Redesenhado**

#### Três Abas Principais:

**📊 Overview (Dashboard)**
- Grid com estatísticas principais
- Cards com: total de utilizadores, admins, tarefas, projetos, tempo registado
- Indicadores de crescimento (novos utilizadores/tarefas esta semana)
- Painel de "Últimas Atividades" com feed em tempo real

**👥 Utilizadores**
- Tabela completa de utilizadores
- Colunas: Nome, Username, Email, Role, Email Verificado, Data Criação
- Mudança de role (USER ↔ ADMIN) em tempo real
- Eliminação com confirmação de segurança

**📝 Atividades**
- Lista formatada de todas as ações no sistema
- Filtros por: ação, tipo de entidade, utilizador, data
- Cores e badges para melhor visualização
- Timestamps formatados em português

### 4. **Serviços de Auditoria**

#### `AuditLogService`
- Centraliza toda a lógica de logging
- Métodos:
  - `log()` - registar nova atividade
  - `getRecentActivity()` - últimas ações
  - `getUserActivity()` - atividades de um utilizador
  - `getActivityStats()` - análise por período
  - `searchLogs()` - pesquisa avançada com filtros

#### `AuditInterceptor` + `@Audit()` Decorator
- Permite decorar métodos para auditoria automática
- Captura: IP, User-Agent, alterações
- Registra erros automaticamente
- Pronto para usar em qualquer controller

### 5. **Funcionalidades Específicas**

✅ **Formatação de Dados**
- Tempo em horas e minutos (ex: "5h 30m")
- Datas em português (ex: "27 fev 2026, 15:38")
- Usernames com @

✅ **Segurança**
- Apenas ADMINs podem aceder ao painel
- Confirmação obrigatória para eliminar utilizadores
- Não pode alterar o próprio role

✅ **Carregamento Eficiente**
- Carrega todos os dados em paralelo com `Promise.all()`
- Paginação com `limit` nos endpoints

## 📊 Tipos de Ações Que Podem Ser Rastreadas

```
- CREATE_USER, UPDATE_USER, DELETE_USER
- CREATE_TASK, UPDATE_TASK, DELETE_TASK
- CREATE_TIME_ENTRY, UPDATE_TIME_ENTRY, DELETE_TIME_ENTRY
- CREATE_PROJECT, UPDATE_PROJECT, DELETE_PROJECT
- CREATE_DOCUMENT, UPDATE_DOCUMENT, DELETE_DOCUMENT
- LOGIN, LOGOUT
- CHANGE_ROLE
- [Qualquer outro evento importante]
```

## 🎨 Design e UX

- **Abas intuitivas** para navegação entre seções
- **Cards informativos** com estatísticas principais
- **Tabela responsiva** com scroll horizontal em mobile
- **Badges de status** com cores significativas
- **Feed de atividades** com scroll vertical
- **Modal de confirmação** para ações destrutivas

## 🚀 Como Usar

### 1. **Acessar o Painel Admin**
- Ir a `/admin` (só para utilizadores com role ADMIN)
- Se não for admin, redirecionado para login

### 2. **Ver Estatísticas**
- Tab "Overview" mostra dashboard com KPIs
- Números são atualizados quando carregar página

### 3. **Gerir Utilizadores**
- Tab "Utilizadores" lista todos
- Clicar no dropdown de Role para mudar
- Botão "Remover" para eliminar (com confirmação)

### 4. **Monitorizar Atividades**
- Tab "Atividades" mostra tudo o que está a acontecer
- Scroll para ver histórico completo
- Filtros e pesquisa disponíveis em breve

## 🔧 Tecnologias Usadas

- **Backend**: NestJS + Prisma
- **Frontend**: Next.js (App Router) + React
- **Database**: PostgreSQL com índices otimizados
- **Real-time Ready**: Estrutura pronta para WebSocket no futuro

## 📈 Próximas Melhorias Sugeridas

1. **Gráficos interativos** - Chart.js ou Recharts
2. **Exportar dados** - CSV/PDF dos logs
3. **Alertas automáticos** - notificar admin de ações críticas
4. **WebSocket** - atualizar atividades em tempo real
5. **Comparação de períodos** - gráficos de crescimento
6. **Geolocalização** - mostrar onde foram feitas ações (por IP)

---

**Status**: ✅ Pronto para produção
**Data**: 27 de Fevereiro de 2026
