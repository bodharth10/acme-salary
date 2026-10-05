import { Alert, Button, Container, Stack } from '@mantine/core'
import { IconAlertCircle } from '@tabler/icons-react'
import { Component, type ErrorInfo, type ReactNode } from 'react'

interface State {
  failed: boolean
}

// Last line of defence: a rendering bug shows a recoverable message instead
// of a blank page. Details go to the console, never to the screen.
export class ErrorBoundary extends Component<{ children: ReactNode }, State> {
  state: State = { failed: false }

  static getDerivedStateFromError(): State {
    return { failed: true }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Unhandled UI error', error, info.componentStack)
  }

  render() {
    if (!this.state.failed) return this.props.children

    return (
      <Container size="sm" py="xl">
        <Stack>
          <Alert color="red" icon={<IconAlertCircle />} title="Something went wrong">
            The page hit an unexpected error. Your data is safe; reloading usually fixes it.
          </Alert>
          <Button onClick={() => window.location.reload()} w="fit-content">
            Reload
          </Button>
        </Stack>
      </Container>
    )
  }
}
