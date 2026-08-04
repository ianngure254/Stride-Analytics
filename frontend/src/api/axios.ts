import { getAuthToken } from '../pages/Firebase/authHelpers'

type ApiOptions = {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
  body?: unknown
  headers?: Record<string, string>
}

export type ApiError = {
  message: string
  status?: number
  code?: string
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ||
  (import.meta.env.PROD ? 'https://stride-analytics.onrender.com/api' : 'http://localhost:3000/api')

const getErrorMessage = (payload: unknown, fallback: string) => {
  if (payload && typeof payload === 'object' && 'error' in payload) {
    const error = (payload as { error?: unknown }).error
    return typeof error === 'string' ? error : fallback
  }

  return fallback
}

const getErrorCode = (payload: unknown) => {
  if (payload && typeof payload === 'object' && 'code' in payload) {
    const code = (payload as { code?: unknown }).code
    return typeof code === 'string' ? code : undefined
  }

  return undefined
}

export const apiRequest = async <TResponse>(path: string, options: ApiOptions = {}): Promise<TResponse> => {
  const token = await getAuthToken()
  if (!token) {
    throw {
      message: 'Authentication token is missing. Please sign in again and refresh the page.',
      status: 401,
    } satisfies ApiError
  }

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...options.headers,
  }

  if (token) {
    headers.Authorization = `Bearer ${token}`
  }

  let response: Response

  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      method: options.method ?? 'GET',
      headers,
      body: options.body === undefined ? undefined : JSON.stringify(options.body),
    })
  } catch {
    throw {
      message: 'Unable to reach the backend. Confirm the API server is running.',
    } satisfies ApiError
  }

  const contentType = response.headers.get('content-type') ?? ''
  const payload = contentType.includes('application/json') ? await response.json() : null

  if (!response.ok) {
    throw {
      message: getErrorMessage(payload, 'Request failed. Please try again.'),
      status: response.status,
      code: getErrorCode(payload),
    } satisfies ApiError
  }

  return payload as TResponse
}

export default apiRequest
