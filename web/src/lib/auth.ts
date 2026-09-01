const AUTH_KEY = 'pnsgracas-admin-session'

/** Credenciais demonstrativas — substituir quando houver autenticação real. */
export const DEMO_ADMIN = {
  username: '[USUARIO]',
  password: '[SENHA]',
  hint: 'Ambiente demonstrativo: use admin / admin até a autenticação real ser configurada.',
}

export function loginAdmin(username: string, password: string) {
  const demoUser = username === 'admin' && password === 'admin'
  const placeholder =
    username === DEMO_ADMIN.username && password === DEMO_ADMIN.password
  if (!demoUser && !placeholder) return false
  sessionStorage.setItem(AUTH_KEY, JSON.stringify({ username, at: Date.now() }))
  return true
}

export function logoutAdmin() {
  sessionStorage.removeItem(AUTH_KEY)
}

export function isAdminAuthenticated() {
  return Boolean(sessionStorage.getItem(AUTH_KEY))
}
