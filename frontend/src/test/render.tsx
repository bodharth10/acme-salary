import { MantineProvider } from '@mantine/core'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render } from '@testing-library/react'
import type { ReactElement } from 'react'
import { theme } from '../theme'

export function renderWithProviders(ui: ReactElement) {
  // A fresh client per test: no cache shared between tests, no retries.
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } })
  return {
    queryClient,
    ...render(
      <MantineProvider theme={theme}>
        <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>
      </MantineProvider>,
    ),
  }
}
