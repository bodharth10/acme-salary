import { Alert, Center, Loader } from '@mantine/core'
import { IconAlertCircle } from '@tabler/icons-react'
import type { ReactNode } from 'react'

// Standard loading / error handling so every page treats them the same way.
export function QueryState({
  isLoading,
  error,
  children,
}: {
  isLoading: boolean
  error: unknown
  children: () => ReactNode
}) {
  if (isLoading)
    return (
      <Center py="xl">
        <Loader />
      </Center>
    )
  if (error)
    return (
      <Alert color="red" icon={<IconAlertCircle />} title="Something went wrong">
        {error instanceof Error ? error.message : 'Unexpected error'}
      </Alert>
    )
  return <>{children()}</>
}
