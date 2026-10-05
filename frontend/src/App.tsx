import { Alert, AppShell, Badge, Button, Center, Container, Group, Loader, Text } from '@mantine/core'
import { IconChartBar, IconCoin, IconLogout, IconUsers } from '@tabler/icons-react'
import { lazy, Suspense } from 'react'
import { NavLink, Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { useSession, useSignOut } from './api/hooks'
import { EmployeeDetailPage } from './pages/EmployeeDetailPage'
import { EmployeesPage } from './pages/EmployeesPage'
import { InsightsPage } from './pages/InsightsPage'
import { LoginPage } from './pages/LoginPage'

// The charting library is the bulk of the bundle; only load it when a
// country breakdown is opened.
const CountryInsightsPage = lazy(() =>
  import('./pages/CountryInsightsPage').then((m) => ({ default: m.CountryInsightsPage })),
)

const NAV = [
  { to: '/employees', label: 'Employees', icon: IconUsers },
  { to: '/insights', label: 'Pay insights', icon: IconChartBar },
]

const ROLE_LABELS = { hr_manager: 'HR Manager', viewer: 'Read-only' } as const

// Nothing behind this gate renders, and no salary request is made, until
// the server confirms a signed-in user.
export function App() {
  const session = useSession()

  if (session.isLoading)
    return (
      <Center mih="100vh">
        <Loader />
      </Center>
    )
  if (session.error)
    return (
      <Center mih="100vh" p="md">
        <Alert color="red" title="Cannot reach the server">
          Please check your connection and reload.
        </Alert>
      </Center>
    )

  const user = session.data?.user
  return user ? <Shell userName={user.name} roleLabel={ROLE_LABELS[user.role]} /> : <LoginPage />
}

function Shell({ userName, roleLabel }: { userName: string; roleLabel: string }) {
  const { pathname } = useLocation()
  const signOut = useSignOut()

  return (
    <AppShell header={{ height: 60 }} padding="md">
      <AppShell.Header>
        <Container size="xl" h="100%">
          <Group h="100%" justify="space-between">
            <Group gap="xs">
              <IconCoin size={24} color="var(--mantine-color-indigo-6)" />
              <Text fw={700}>ACME Salary Manager</Text>
            </Group>
            <Group gap="xs">
              {NAV.map(({ to, label, icon: Icon }) => (
                <Button
                  key={to}
                  component={NavLink}
                  to={to}
                  variant={pathname.startsWith(to) ? 'light' : 'subtle'}
                  leftSection={<Icon size={16} />}
                >
                  {label}
                </Button>
              ))}
              <Text size="sm" visibleFrom="sm" ml="md">
                {userName}
              </Text>
              <Badge variant="light" color="gray" visibleFrom="sm">
                {roleLabel}
              </Badge>
              <Button
                variant="default"
                size="xs"
                leftSection={<IconLogout size={14} />}
                loading={signOut.isPending}
                onClick={() => signOut.mutate()}
              >
                Sign out
              </Button>
            </Group>
          </Group>
        </Container>
      </AppShell.Header>
      <AppShell.Main>
        <Container size="xl">
          <Suspense
            fallback={
              <Center py="xl">
                <Loader />
              </Center>
            }
          >
            <Routes>
              <Route path="/" element={<Navigate to="/employees" replace />} />
              <Route path="/employees" element={<EmployeesPage />} />
              <Route path="/employees/:id" element={<EmployeeDetailPage />} />
              <Route path="/insights" element={<InsightsPage />} />
              <Route path="/insights/:code" element={<CountryInsightsPage />} />
              <Route path="*" element={<Navigate to="/employees" replace />} />
            </Routes>
          </Suspense>
        </Container>
      </AppShell.Main>
    </AppShell>
  )
}
