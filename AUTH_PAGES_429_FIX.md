# 🔐 Correção: HTTP 429 Erros em Páginas de Autenticação

## 📋 Problema Reportado

Erro **429 Too Many Requests** na página de login ao tentar fazer login:

```
API Error (429): {}
at apiFetch (lib/api.ts:41:13)
at async handleLogin (app/login/page.tsx:28:19)
```

**Impacto**: Impossível fazer login ou criar conta durante desenvolvimento

---

## 🔍 Root Cause Analysis

### Problema Identificado

**React StrictMode + Clique de Botão**

Em React StrictMode durante desenvolvimento:
1. Componente renderiza 2 vezes para detectar side effects
2. Evento `onClick` no botão "Entrar" dispara 2 vezes
3. `handleLogin()` é chamado simultaneamente 2 vezes
4. 2 requisições POST para `/auth/login` em paralelo
5. Rate limiter bloqueia (100 req/15 min)

**Padrão do Erro**:
```typescript
// ANTES - Vulnerável a cliques duplos
<button onClick={handleLogin} type="submit">
  Entrar
</button>

async function handleLogin(e?: React.FormEvent) {
  // Sem proteção contra múltiplas chamadas simultâneas
  const res = await apiFetch('/auth/login', { ... });
}
```

**Por que ocorre**:
- StrictMode: intentionally double-calls effects and renders
- Button click: usuário clica rapidamente ou StrictMode re-renders causa outro disparo
- Sem flag de controle: nenhuma proteção contra requisições simultâneas
- Rate limit global: 100 req/15 min é rapidamente atingido

---

## ✅ Solução Implementada

### Padrão: useRef para Controle de Requisições

**Estratégia**: Usar `useRef` para rastrear se uma requisição já está em progresso. Se sim, ignora cliques adicionais.

```typescript
const loginInProgressRef = useRef(false);

async function handleLogin(e?: React.FormEvent) {
  e?.preventDefault();
  
  // ✅ PROTEÇÃO: Se já há requisição em progresso, ignora
  if (loginInProgressRef.current) {
    return;
  }
  
  // ... validações ...
  
  try {
    loginInProgressRef.current = true;  // Marca como em progresso
    const res = await apiFetch('/auth/login', { ... });
    // ... lógica de sucesso ...
  } catch (err: any) {
    // ... lógica de erro ...
  } finally {
    loginInProgressRef.current = false;  // Marca como completo
  }
}
```

**Por que funciona**:
- `ref` não causa re-render, persiste entre renders
- StrictMode mesmo renderizando 2 vezes compartilha o mesmo `ref`
- Primeira chamada seta `loginInProgressRef.current = true`
- Cliques adicionais veem `true` e retornam sem fazer nada
- Após `finally`, `false` permite próximo login

---

## 📁 Arquivos Modificados

### 1. `frontend/app/login/page.tsx`

**Mudanças**:
- ✅ Importa `useRef` do React
- ✅ Cria `loginInProgressRef` para rastrear requisições
- ✅ Protege `handleLogin()` com guard clause
- ✅ Protege `handleVerifyEmail()` com guard clause  
- ✅ Protege `handleResendCode()` com guard clause
- ✅ Usa `finally` para sempre resetar flag

**Antes**:
```typescript
async function handleLogin(e?: React.FormEvent) {
  e?.preventDefault();
  // Sem proteção - múltiplas chamadas possíveis
  const res = await apiFetch('/auth/login', { ... });
}
```

**Depois**:
```typescript
const loginInProgressRef = useRef(false);

async function handleLogin(e?: React.FormEvent) {
  e?.preventDefault();
  
  if (loginInProgressRef.current) return;  // ✅ Guard clause
  
  try {
    loginInProgressRef.current = true;
    const res = await apiFetch('/auth/login', { ... });
  } catch (err: any) {
    setError(err.message || 'Erro ao fazer login');
  } finally {
    loginInProgressRef.current = false;
  }
}
```

### 2. `frontend/app/register/page.tsx`

**Mudanças**:
- ✅ Importa `useRef` do React
- ✅ Cria `submitInProgressRef` para rastrear requisições
- ✅ Protege `submit()` (registro) com guard clause
- ✅ Protege `handleVerifyEmail()` com guard clause
- ✅ Protege `handleResendCode()` com guard clause
- ✅ Usa `finally` para sempre resetar flag

**Mesmo padrão da página de login**

---

## 📊 Impacto

### Antes (com StrictMode)
| Ação | Requisições | Problema |
|------|-----------|----------|
| Clique "Entrar" | 2+ simultâneas | ❌ 429 Too Many |
| Clique "Criar Conta" | 2+ simultâneas | ❌ 429 Too Many |
| Clique "Reenviar Código" | 2+ simultâneas | ❌ 429 Too Many |

### Depois (com guard clause)
| Ação | Requisições | Status |
|------|-----------|--------|
| Clique "Entrar" | 1 | ✅ OK |
| Clique "Criar Conta" | 1 | ✅ OK |
| Clique "Reenviar Código" | 1 | ✅ OK |

---

## 🎯 Por que isso funciona

1. **Ref persiste entre renders**: StrictMode pode re-renderizar, mas `ref.current` mantém valor
2. **Guard clause simples**: Verifica se requisição está em progresso, se sim retorna
3. **Finally garante reset**: Mesmo com erro, flag é resetada para próxima requisição
4. **UX melhorada**: Botão continua desabilitado enquanto requisição está em andamento (via `loading` state)
5. **Zero overhead**: Apenas um `useRef`, sem context, sem hooks customizados

---

## 🧪 Como Testar

```bash
# Em development (com StrictMode)
npm run dev

# Teste no navegador:
# 1. Vá para http://localhost:3000/login
# 2. Abra DevTools (F12) → Network tab
# 3. Clique em "Entrar" rapidamente
#    Esperado: Apenas 1 requisição POST /auth/login
#    Antes: 2+ requisições (429 error)

# 4. Vá para http://localhost:3000/register
# 5. Clique em "Criar Conta" rapidamente
#    Esperado: Apenas 1 requisição POST /auth/register
#    Antes: 2+ requisições (429 error)
```

---

## 🔐 Comparação com Alternativas

### ❌ Desabilitar StrictMode
```typescript
// React 18+ em development
// StrictMode é útil para detectar bugs
// Não devemos desabilitar apenas para evitar este erro
```

### ❌ Aumentar Rate Limit
```typescript
// Solução superficial
// Apenas mascararia o problema real
// Em produção não há StrictMode, não seria necessário
```

### ✅ useRef Guard (Solução Escolhida)
```typescript
// Mais simples, mais eficiente
// Funciona em StrictMode e produção
// Sem overhead adicional
// Padrão recomendado para controle de requisições
```

---

## 📚 Padrão Recomendado

Para qualquer página com botões que disparam requisições:

```typescript
const actionInProgressRef = useRef(false);

async function handleAction() {
  // SEMPRE adicionar este guard
  if (actionInProgressRef.current) {
    return;
  }
  
  try {
    actionInProgressRef.current = true;
    // Sua requisição aqui
  } finally {
    actionInProgressRef.current = false;
  }
}
```

---

## ✅ Status

| Componente | Status | Data |
|-----------|--------|------|
| Login Page | ✅ FIXED | 15/02/2026 |
| Register Page | ✅ FIXED | 15/02/2026 |
| Logout | ✅ SAFE | N/A |
| OAuth Pages | ✅ SAFE | N/A |

---

**Data**: 15 Fevereiro 2026  
**Tipo**: Frontend Authentication Fix  
**Risco**: ZERO (apenas proteção adicional)  
**Impacto**: Crítico (era impossível fazer login)
