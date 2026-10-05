import type {
  CountryInsights,
  Employee,
  EmployeeDetail,
  EmployeeFilters,
  EmployeeInput,
  Meta,
  Overview,
  Paginated,
  Session,
} from './types'

const BASE_URL = import.meta.env.VITE_API_URL ?? ''

export type FieldErrors = Record<string, string[]>

export class ApiError extends Error {
  readonly status: number
  readonly fieldErrors: FieldErrors

  constructor(status: number, message: string, fieldErrors: FieldErrors = {}) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.fieldErrors = fieldErrors
  }
}

// The session cookie is HttpOnly, so scripts cannot read it. The CSRF token
// is the proof that a write really comes from this app; it lives in memory
// only and is refreshed whenever the session changes.
let csrfToken: string | null = null

export function setCsrfToken(token: string | null) {
  csrfToken = token
}

const SAFE_METHODS = ['GET', 'HEAD']

export function toQueryString(params: object): string {
  const search = new URLSearchParams()
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') search.set(key, String(value))
  })
  const query = search.toString()
  return query ? `?${query}` : ''
}

export async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const method = (init.method ?? 'GET').toUpperCase()
  const csrfHeader: Record<string, string> =
    csrfToken && !SAFE_METHODS.includes(method) ? { 'X-CSRF-Token': csrfToken } : {}

  const response = await fetch(`${BASE_URL}${path}`, {
    ...init,
    credentials: 'same-origin',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json', ...csrfHeader, ...init.headers },
  })

  if (response.status === 204) return undefined as T

  const body = await response.json().catch(() => ({}))
  if (!response.ok) {
    throw new ApiError(response.status, body.message ?? `Request failed (${response.status})`, body.errors)
  }
  return body as T
}

// Every session response carries a fresh CSRF token: remember it.
async function sessionRequest(init?: RequestInit): Promise<Session> {
  const session = await request<Session>('/api/v1/session', init)
  setCsrfToken(session.csrf_token)
  return session
}

export const api = {
  session: () => sessionRequest(),
  signIn: (email: string, password: string) =>
    sessionRequest({ method: 'POST', body: JSON.stringify({ session: { email, password } }) }),
  signOut: () => sessionRequest({ method: 'DELETE' }),
  meta: () => request<Meta>('/api/v1/meta'),
  listEmployees: (filters: EmployeeFilters) =>
    request<Paginated<Employee>>(`/api/v1/employees${toQueryString(filters)}`),
  getEmployee: (id: number) => request<EmployeeDetail>(`/api/v1/employees/${id}`),
  createEmployee: (employee: EmployeeInput) =>
    request<Employee>('/api/v1/employees', { method: 'POST', body: JSON.stringify({ employee }) }),
  updateEmployee: (id: number, employee: Partial<EmployeeInput>) =>
    request<Employee>(`/api/v1/employees/${id}`, { method: 'PATCH', body: JSON.stringify({ employee }) }),
  deleteEmployee: (id: number) => request<void>(`/api/v1/employees/${id}`, { method: 'DELETE' }),
  overview: () => request<Overview>('/api/v1/insights/overview'),
  countryInsights: (code: string) => request<CountryInsights>(`/api/v1/insights/countries/${code}`),
}
