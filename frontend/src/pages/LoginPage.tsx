import { Alert, Button, Center, Paper, PasswordInput, Stack, Text, TextInput, Title } from '@mantine/core'
import { useForm } from '@mantine/form'
import { IconAlertCircle, IconCoin } from '@tabler/icons-react'
import { ApiError } from '../api/client'
import { useSignIn } from '../api/hooks'

export function LoginPage() {
  const signIn = useSignIn()
  const form = useForm({
    initialValues: { email: '', password: '' },
    validate: {
      email: (v) => (v.trim() ? null : 'Email is required'),
      password: (v) => (v ? null : 'Password is required'),
    },
  })

  const errorMessage = !signIn.error
    ? null
    : signIn.error instanceof ApiError && signIn.error.status === 429
      ? 'Too many attempts. Please wait a minute and try again.'
      : signIn.error instanceof ApiError && signIn.error.status === 401
        ? 'Invalid email or password.'
        : 'Could not sign in. Please try again.'

  return (
    <Center mih="100vh" p="md">
      <Paper withBorder p="xl" radius="md" w="100%" maw={400}>
        <form onSubmit={form.onSubmit((values) => signIn.mutate(values))} noValidate>
          <Stack>
            <Stack gap={4} align="center">
              <IconCoin size={36} color="var(--mantine-color-indigo-6)" />
              <Title order={3}>ACME Salary Manager</Title>
              <Text size="sm" c="dimmed">
                Sign in to continue
              </Text>
            </Stack>

            {errorMessage && (
              <Alert color="red" icon={<IconAlertCircle />} role="alert">
                {errorMessage}
              </Alert>
            )}

            <TextInput label="Email" type="email" autoComplete="username" autoFocus {...form.getInputProps('email')} />
            <PasswordInput label="Password" autoComplete="current-password" {...form.getInputProps('password')} />
            <Button type="submit" loading={signIn.isPending} fullWidth>
              Sign in
            </Button>
          </Stack>
        </form>
      </Paper>
    </Center>
  )
}
