export function setToken(token: string) {
  localStorage.setItem('token', token);
}

export function setRole(role: string) {
  localStorage.setItem('role', role);
}

export function getToken() {
  return localStorage.getItem('token');
}

export function getRole() {
  return localStorage.getItem('role');
}

export function logout() {
  localStorage.removeItem('token');
  localStorage.removeItem('role');
  window.location.href = '/login';
}
