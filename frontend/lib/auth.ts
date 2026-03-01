export function setToken(token: string) {
  localStorage.setItem('token', token);
}

/**
 * @deprecated Use getRole() que extrai do JWT. Mantido por compatibilidade.
 */
export function setRole(_role: string) {
  // Não guardar role no localStorage — extrair do JWT
}

export function getToken() {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('token');
}

/** Extrai o role do payload do JWT em vez de confiar no localStorage */
export function getRole(): string | null {
  const payload = getTokenPayload();
  return payload?.role || null;
}

export function getCurrentUserId(): string | null {
  const payload = getTokenPayload();
  return payload?.sub || null;
}

/** Descodifica o payload do JWT de forma segura */
function getTokenPayload(): { sub?: string; email?: string; role?: string; exp?: number } | null {
  const token = getToken();
  if (!token) return null;

  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    // base64url → base64 standard
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const payload = JSON.parse(atob(base64));

    // Verificar se o token expirou
    if (payload.exp && payload.exp * 1000 < Date.now()) {
      logout();
      return null;
    }

    return payload;
  } catch (e) {
    return null;
  }
}

export function logout() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('token');
  window.location.href = '/login';
}
