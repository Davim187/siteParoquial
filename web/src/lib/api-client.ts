const API_URL = (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/$/, '') || ''

type RequestOptions = Omit<RequestInit, 'body'> & {
  auth?: boolean
  json?: unknown
  body?: BodyInit | null
}

function getTokens() {
  return {
    accessToken: localStorage.getItem('paroquia_access_token'),
    refreshToken: localStorage.getItem('paroquia_refresh_token'),
  }
}

export function setTokens(accessToken: string, refreshToken?: string) {
  localStorage.setItem('paroquia_access_token', accessToken)
  if (refreshToken) localStorage.setItem('paroquia_refresh_token', refreshToken)
}

export function clearTokens() {
  localStorage.removeItem('paroquia_access_token')
  localStorage.removeItem('paroquia_refresh_token')
  localStorage.removeItem('paroquia_user')
}

async function parseError(response: Response) {
  const err = await response.json().catch(() => ({ message: 'Erro na API' }))
  return new Error(err.message || 'Erro na API')
}

async function refreshAccessToken() {
  const { refreshToken } = getTokens()
  if (!refreshToken) return null
  try {
    const response = await fetch(`${API_URL}/api/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    })
    if (!response.ok) {
      clearTokens()
      return null
    }
    const data = (await response.json()) as { accessToken: string }
    setTokens(data.accessToken)
    return data.accessToken
  } catch {
    return null
  }
}

async function doFetch(path: string, init: RequestInit) {
  try {
    return await fetch(`${API_URL}${path}`, init)
  } catch {
    throw new Error(
      'Não foi possível conectar à API. Confirme se o servidor em http://localhost:3333 está no ar e recarregue a página.',
    )
  }
}

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { auth = true, json, ...rest } = options
  const headers = new Headers(rest.headers)
  if (json !== undefined) {
    headers.set('Content-Type', 'application/json')
  }
  if (auth) {
    const { accessToken } = getTokens()
    if (accessToken) headers.set('Authorization', `Bearer ${accessToken}`)
  }

  const init: RequestInit = {
    ...rest,
    headers,
    body: json !== undefined ? JSON.stringify(json) : rest.body,
  }

  let response = await doFetch(path, init)

  if (response.status === 401 && auth) {
    const next = await refreshAccessToken()
    if (next) {
      headers.set('Authorization', `Bearer ${next}`)
      response = await doFetch(path, { ...init, headers })
    }
  }

  if (!response.ok) throw await parseError(response)
  if (response.status === 204) return undefined as T
  return (await response.json()) as T
}

export function mediaUrl(url?: string | null) {
  if (!url) return ''
  if (url.startsWith('http')) return url
  return `${API_URL}${url}`
}

export { API_URL }
