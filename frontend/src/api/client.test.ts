import { afterEach, describe, expect, it, vi } from 'vitest'
import { api, ApiError, setCsrfToken, toQueryString } from './client'

function mockFetch(status: number, body?: unknown) {
  const fetchMock = vi.fn().mockResolvedValue(
    new Response(body === undefined ? null : JSON.stringify(body), { status }),
  )
  vi.stubGlobal('fetch', fetchMock)
  return fetchMock
}

afterEach(() => {
  vi.unstubAllGlobals()
  setCsrfToken(null)
})

describe('toQueryString', () => {
  it('drops empty values', () => {
    expect(toQueryString({ q: 'ann', country: '', page: 2, sort: undefined })).toBe('?q=ann&page=2')
    expect(toQueryString({})).toBe('')
  })
})

describe('api', () => {
  it('requests the employee list with filters', async () => {
    const fetchMock = mockFetch(200, { data: [], meta: { total: 0, page: 1, per_page: 25, total_pages: 0 } })
    await api.listEmployees({ country: 'IN', page: 2 })
    expect(fetchMock).toHaveBeenCalledWith('/api/v1/employees?country=IN&page=2', expect.any(Object))
  })

  it('wraps the payload under "employee" when creating', async () => {
    const fetchMock = mockFetch(201, { id: 1 })
    await api.createEmployee({
      full_name: 'A',
      email: 'a@b.co',
      job_title: 'X',
      department: 'Sales',
      country_code: 'US',
      employment_type: 'full_time',
      salary: 1,
      hire_date: '2020-01-01',
    })
    const [, init] = fetchMock.mock.calls[0]
    expect(init.method).toBe('POST')
    expect(JSON.parse(init.body).employee.full_name).toBe('A')
  })

  it('throws ApiError with field errors on validation failure', async () => {
    mockFetch(422, { error: 'validation_failed', errors: { email: ['has already been taken'] } })
    const error = await api.createEmployee({} as never).catch((e) => e)
    expect(error).toBeInstanceOf(ApiError)
    expect(error.status).toBe(422)
    expect(error.fieldErrors).toEqual({ email: ['has already been taken'] })
  })

  it('handles 204 No Content on delete', async () => {
    mockFetch(204)
    await expect(api.deleteEmployee(5)).resolves.toBeUndefined()
  })
})

describe('CSRF token', () => {
  const session = { user: null, csrf_token: 'token-abc' }

  it('is remembered from the session response and sent on writes only', async () => {
    const fetchMock = mockFetch(200, session)
    await api.session()

    await api.deleteEmployee(5).catch(() => {})
    await api.overview()

    const [, deleteCall, readCall] = fetchMock.mock.calls
    expect(deleteCall[1].headers['X-CSRF-Token']).toBe('token-abc')
    expect(readCall[1].headers['X-CSRF-Token']).toBeUndefined()
  })

  it('is replaced after signing in, because the server rotates it', async () => {
    mockFetch(200, session)
    await api.session()

    const fetchMock = mockFetch(201, { user: null, csrf_token: 'token-new' })
    await api.signIn('hr@acme.example', 'a-test-password')
    await api.signOut()

    expect(fetchMock.mock.calls[0][1].headers['X-CSRF-Token']).toBe('token-abc')
    expect(fetchMock.mock.calls[1][1].headers['X-CSRF-Token']).toBe('token-new')
  })
})
