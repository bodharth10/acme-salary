import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { queryKeys } from '../api/hooks'
import { renderWithProviders } from '../test/render'
import { LoginPage } from './LoginPage'

function mockFetch(status: number, body: unknown) {
  const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify(body), { status }))
  vi.stubGlobal('fetch', fetchMock)
  return fetchMock
}

async function submit(email: string, password: string) {
  await userEvent.type(screen.getByLabelText('Email'), email)
  await userEvent.type(screen.getByLabelText('Password'), password)
  await userEvent.click(screen.getByRole('button', { name: 'Sign in' }))
}

afterEach(() => vi.unstubAllGlobals())

describe('LoginPage', () => {
  it('does not call the server when fields are empty', async () => {
    const fetchMock = mockFetch(200, {})
    renderWithProviders(<LoginPage />)

    await userEvent.click(screen.getByRole('button', { name: 'Sign in' }))

    expect(await screen.findByText('Email is required')).toBeInTheDocument()
    expect(screen.getByText('Password is required')).toBeInTheDocument()
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('signs in and stores the session', async () => {
    const session = {
      user: { id: 1, name: 'Hana', email: 'hr@acme.example', role: 'hr_manager', permissions: { manage_employees: true } },
      csrf_token: 'token-1',
    }
    const fetchMock = mockFetch(201, session)
    const { queryClient } = renderWithProviders(<LoginPage />)

    await submit('hr@acme.example', 'a-test-password')

    await waitFor(() => expect(queryClient.getQueryData(queryKeys.session)).toEqual(session))
    const [url, init] = fetchMock.mock.calls[0]
    expect(url).toBe('/api/v1/session')
    expect(init.method).toBe('POST')
    expect(JSON.parse(init.body)).toEqual({ session: { email: 'hr@acme.example', password: 'a-test-password' } })
  })

  it('shows one generic message for bad credentials', async () => {
    mockFetch(401, { error: 'invalid_credentials', message: 'Invalid email or password.' })
    renderWithProviders(<LoginPage />)

    await submit('hr@acme.example', 'wrong-password')

    expect(await screen.findByRole('alert')).toHaveTextContent('Invalid email or password.')
  })

  it('explains when sign-in is rate limited', async () => {
    mockFetch(429, { error: 'rate_limited' })
    renderWithProviders(<LoginPage />)

    await submit('hr@acme.example', 'wrong-password')

    expect(await screen.findByRole('alert')).toHaveTextContent('Too many attempts')
  })
})
