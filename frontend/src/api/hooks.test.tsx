import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, renderHook, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { queryKeys, useCanManageEmployees, useSession, useSignOut } from './hooks'
import type { Session } from './types'

const signedIn: Session = {
  user: { id: 1, name: 'Hana', email: 'hr@acme.example', role: 'hr_manager', permissions: { manage_employees: true } },
  csrf_token: 'token-1',
}
const signedOut: Session = { user: null, csrf_token: 'token-2' }

function setup() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  client.setQueryData(queryKeys.session, signedIn)
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  )
  return { client, wrapper }
}

afterEach(() => vi.unstubAllGlobals())

describe('useSignOut', () => {
  it('switches subscribers to signed-out and removes cached salary data', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify(signedOut), { status: 200 })))
    const { client, wrapper } = setup()
    client.setQueryData(queryKeys.overview, { headcount: 10000 })

    const { result } = renderHook(() => ({ session: useSession(), signOut: useSignOut() }), { wrapper })
    expect(result.current.session.data?.user?.name).toBe('Hana')

    await act(() => result.current.signOut.mutateAsync())

    await waitFor(() => expect(result.current.session.data?.user).toBeNull())
    expect(client.getQueryData(queryKeys.overview)).toBeUndefined()
  })
})

describe('useCanManageEmployees', () => {
  it('follows the permission the server reports', () => {
    const { client, wrapper } = setup()
    expect(renderHook(() => useCanManageEmployees(), { wrapper }).result.current).toBe(true)

    client.setQueryData(queryKeys.session, {
      ...signedIn,
      user: { ...signedIn.user!, role: 'viewer', permissions: { manage_employees: false } },
    })
    expect(renderHook(() => useCanManageEmployees(), { wrapper }).result.current).toBe(false)
  })

  it('is false when nobody is signed in', () => {
    const { client, wrapper } = setup()
    client.setQueryData(queryKeys.session, signedOut)
    expect(renderHook(() => useCanManageEmployees(), { wrapper }).result.current).toBe(false)
  })
})
