import '@mantine/core/styles.css'
import '@mantine/charts/styles.css'
import '@mantine/notifications/styles.css'

import { MantineProvider } from '@mantine/core'
import { Notifications } from '@mantine/notifications'
import { QueryCache, QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { ApiError } from './api/client'
import { queryKeys } from './api/hooks'
import { App } from './App'
import { ErrorBoundary } from './components/ErrorBoundary'
import { theme } from './theme'

const isClientError = (error: unknown) => error instanceof ApiError && error.status >= 400 && error.status < 500

const queryClient: QueryClient = new QueryClient({
  queryCache: new QueryCache({
    // A 401 on any request means the session ended (idle timeout, sign-out
    // in another tab): re-check it, which sends the user to the login page.
    onError: (error) => {
      if (error instanceof ApiError && error.status === 401) {
        void queryClient.invalidateQueries({ queryKey: queryKeys.session })
      }
    },
  }),
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      refetchOnWindowFocus: false,
      // Retrying a 401/403/404 cannot succeed; only retry real failures.
      retry: (failureCount, error) => !isClientError(error) && failureCount < 1,
    },
  },
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <MantineProvider theme={theme} defaultColorScheme="auto">
      <Notifications position="top-right" />
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <ErrorBoundary>
            <App />
          </ErrorBoundary>
        </BrowserRouter>
      </QueryClientProvider>
    </MantineProvider>
  </StrictMode>,
)
