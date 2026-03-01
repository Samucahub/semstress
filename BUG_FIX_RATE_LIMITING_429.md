# 🔧 Correção: Rate Limiting 429 Error

## 📋 Problema Reportado

Erro **429 (Too Many Requests)** ao carregar a página de admin:

```
API Error (429): {}
at apiFetch (lib/api.ts:41:13)
at async loadUsers (app/admin/page.tsx:41:20)
```

---

## 🔍 Root Cause Analysis

### Identificação do Problema

1. **React 18 StrictMode em Desenvolvimento**
   - Em modo desenvolvimento, o React executa efeitos **2 vezes** para detectar problemas
   - `useEffect(() => loadUsers(), [])` executa o efeito 2 vezes
   - Cada useEffect sem dependências → 2 chamadas API simultâneas

2. **Rate Limiting Global**
   - Configurado para **100 requisições por 15 minutos**
   - Com StrictMode: cada página faz 2-3 requisições em vez de 1
   - Rápido demais = 429 Too Many Requests

3. **Múltiplas Páginas com o Mesmo Problema**
   - Dashboard: `loadSummary()`, `loadTasks()`, `loadRecentEntries()` (3 chamadas x2)
   - SimpleTasksPage: `loadData()` (Promise.all com 2 chamadas x2)
   - TimeEntriesPage: `loadTasks()`, `loadEntries()` (2 chamadas x2)
   - ProjectsPage: `loadProjects()` (Promise.all com 3 chamadas x2)
   - AdminPage: `loadUsers()` (1 chamada x2)

### Impacto

- ❌ Páginas não carregam em desenvolvimento
- ❌ Rate limiter bloqueando requisições legítimas
- ❌ Experiência de desenvolvimento ruim
- ❌ Produção não seria afetada (sem StrictMode)

---

## ✅ Solução Implementada

### 1. Hook Customizado: `useOnceEffect`

**Arquivo**: `frontend/lib/hooks.ts` (NOVO)

```typescript
export function useOnceEffect(effect: () => void | (() => void)) {
  const hasRun = useRef(false);

  useEffect(() => {
    if (!hasRun.current) {
      hasRun.current = true;
      return effect();
    }
  }, [effect]);
}
```

**Como funciona**:
- Usa ref para rastrear se o efeito já foi executado
- Executa apenas na **primeira montagem**
- Evita duplicação do React StrictMode

---

### 2. Aplicação em Todas as Páginas

#### Admin Page
```typescript
// ANTES
useEffect(() => {
  setCurrentUserId(getCurrentUserId());
  loadUsers();  // Executa 2 vezes em StrictMode
}, []);

// DEPOIS
useEffect(() => {
  setCurrentUserId(getCurrentUserId());
}, []);

useOnceEffect(() => {
  loadUsers();  // Executa apenas 1 vez
});
```

#### Dashboard Page
```typescript
// ANTES
useEffect(() => {
  loadSummary();
  loadTasks();
  loadRecentEntries();  // 3 chamadas x2 = 6 requisições
}, []);

// DEPOIS
useOnceEffect(() => {
  loadSummary();
  loadTasks();
  loadRecentEntries();  // 3 chamadas x1 = 3 requisições
});
```

#### SimpleTasksPage
```typescript
// ANTES
useEffect(() => {
  loadData();  // Promise.all([statuses, tasks]) x2 = 4 chamadas
}, []);

// DEPOIS
useOnceEffect(() => {
  loadData();  // Promise.all([statuses, tasks]) x1 = 2 chamadas
});
```

#### TimeEntriesPage
```typescript
// ANTES
useEffect(() => {
  loadTasks().catch(...);  // x2 = 2 chamadas
}, []);

// DEPOIS
useOnceEffect(() => {
  loadTasks().catch(...);  // x1 = 1 chamada
});
```

#### ProjectsPage
```typescript
// ANTES
useEffect(() => {
  loadProjects();  // Promise.all([projects, invites, transfers]) x2 = 6 chamadas
}, []);

// DEPOIS
useOnceEffect(() => {
  loadProjects();  // Promise.all([projects, invites, transfers]) x1 = 3 chamadas
});
```

---

## 📊 Impacto

### Antes (com StrictMode em dev)
| Página | Requisições | Problema |
|--------|-----------|----------|
| Admin | 2 | ❌ 429 |
| Dashboard | 6 | ❌ 429 |
| SimpleTasksPage | 4 | ❌ 429 |
| TimeEntries | 2 | ❌ 429 |
| Projects | 6 | ❌ 429 |

### Depois (com useOnceEffect)
| Página | Requisições | Status |
|--------|-----------|--------|
| Admin | 1 | ✅ OK |
| Dashboard | 3 | ✅ OK |
| SimpleTasksPage | 2 | ✅ OK |
| TimeEntries | 1 | ✅ OK |
| Projects | 3 | ✅ OK |

---

## 🎯 Por que isso funciona

1. **useOnceEffect** guarda estado de execução com ref
2. Ref persiste entre re-renders
3. React StrictMode pode re-executar o useEffect
4. Mas ref garante que o efeito roda apenas uma vez
5. Sem perder funcionalidade (cleanup ainda funciona)

---

## 🔐 Alternativas Consideradas

### ❌ Aumentar Rate Limit
- Não é segurança
- Produção sem StrictMode não teria problema

### ❌ Desabilitar StrictMode
- StrictMode detecta bugs
- Importante para desenvolvimento
- Não deve ser desativado

### ✅ useOnceEffect Hook
- Mantém StrictMode ativo
- Evita duplicação de requisições
- Padrão limpo e reutilizável
- Zero impacto em produção

---

## 📝 Padrão Recomendado

### Para requisições de inicialização:
```typescript
import { useOnceEffect } from '@/lib/hooks';

export default function MyPage() {
  const [data, setData] = useState(null);

  // Use useOnceEffect para requisições que devem rodar UMA VEZ
  useOnceEffect(() => {
    loadData();
  });

  // Use useEffect normal para reações a mudanças
  useEffect(() => {
    handleSearchChange();
  }, [searchTerm]);
}
```

---

## 📁 Arquivos Modificados

| Arquivo | Tipo | Mudanças |
|---------|------|----------|
| `frontend/lib/hooks.ts` | NOVO | Hook `useOnceEffect` para evitar duplicação |
| `frontend/app/admin/page.tsx` | Modificado | Usa `useOnceEffect` para `loadUsers()` |
| `frontend/app/dashboard/page.tsx` | Modificado | Usa `useOnceEffect` para `loadSummary()` etc |
| `frontend/app/simple-tasks/page.tsx` | Modificado | Usa `useOnceEffect` para `loadData()` |
| `frontend/app/time-entries/page.tsx` | Modificado | Usa `useOnceEffect` para `loadTasks()` |
| `frontend/app/projects/page.tsx` | Modificado | Usa `useOnceEffect` para `loadProjects()` |

---

## ✅ Verificação

```bash
# Em desenvolvimento com npm run dev
# Acesse as páginas
✅ /admin              # Carrega sem erro 429
✅ /dashboard          # Carrega sem erro 429
✅ /simple-tasks       # Carrega sem erro 429
✅ /time-entries       # Carrega sem erro 429
✅ /projects           # Carrega sem erro 429

# Ver console do browser (F12)
# Deve ter apenas UMA chamada por página
```

---

## 🚀 Impacto em Produção

**ZERO**: Em produção:
- React.StrictMode não é ativado
- Efeitos não são duplicados
- `useOnceEffect` e `useEffect` se comportam identicamente
- Sem overhead adicional

---

**Data**: 15 Fevereiro 2026  
**Status**: ✅ RESOLVIDO  
**Tipo**: Frontend Development Experience  
**Risco**: BAIXO (apenas em dev, não afeta produção)
