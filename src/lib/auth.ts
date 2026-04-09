const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

export interface Comerciante {
  id: string
  nome: string
  email: string
  whatsapp: string
  comercio_id: string | null
  status: string
}

export interface AuthState {
  token: string
  comerciante: Comerciante
}

// Salva sessão no localStorage
export function salvarSessao(auth: AuthState) {
  localStorage.setItem('vl_token', auth.token)
  localStorage.setItem('vl_user', JSON.stringify(auth.comerciante))
}

// Recupera sessão
export function obterSessao(): AuthState | null {
  if (typeof window === 'undefined') return null
  const token = localStorage.getItem('vl_token')
  const user = localStorage.getItem('vl_user')
  if (!token || !user) return null
  try {
    return { token, comerciante: JSON.parse(user) }
  } catch {
    return null
  }
}

// Limpa sessão
export function limparSessao() {
  localStorage.removeItem('vl_token')
  localStorage.removeItem('vl_user')
}

// Fetch autenticado
export async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const token = localStorage.getItem('vl_token')
  const res = await fetch(`${API_URL}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options?.headers,
    },
    ...options,
  })

  if (res.status === 401) {
    limparSessao()
    window.location.href = '/comerciante/login'
    throw new Error('Sessão expirada')
  }

  const data = await res.json()
  if (!res.ok) throw new Error(data.erro || 'Erro na requisição')
  return data
}

// Login
export async function login(email: string, senha: string): Promise<AuthState> {
  const res = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, senha }),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.erro || 'Erro ao fazer login')
  return data
}

// Registro
export async function registro(body: {
  nome: string; email: string; senha: string; whatsapp: string
}): Promise<AuthState> {
  const res = await fetch(`${API_URL}/auth/registro`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.erro || 'Erro ao criar conta')
  return data
}
