import {
  Button,
  Center,
  Group,
  Modal,
  Pagination,
  Paper,
  Select,
  Stack,
  Table,
  Text,
  TextInput,
  Title,
  UnstyledButton,
} from '@mantine/core'
import { useDebouncedCallback, useDisclosure } from '@mantine/hooks'
import { notifications } from '@mantine/notifications'
import { IconChevronDown, IconChevronUp, IconPlus, IconSearch, IconSelector } from '@tabler/icons-react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useCanManageEmployees, useCreateEmployee, useEmployees, useMeta } from '../api/hooks'
import type { EmployeeFilters } from '../api/types'
import { EmployeeForm } from '../components/EmployeeForm'
import { QueryState } from '../components/QueryState'
import { filtersFromSearchParams, filtersToSearchParams, nextSort } from '../lib/filters'
import { formatEmploymentType, formatMoney, formatNumber } from '../lib/format'

const PER_PAGE = 25

export function EmployeesPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const filters = filtersFromSearchParams(searchParams)
  const navigate = useNavigate()
  const meta = useMeta()
  const employees = useEmployees({ ...filters, per_page: PER_PAGE })
  const createEmployee = useCreateEmployee()
  const canManage = useCanManageEmployees()
  const [addOpen, { open: openAdd, close: closeAdd }] = useDisclosure(false)

  const update = (next: EmployeeFilters) => setSearchParams(filtersToSearchParams(next), { replace: true })
  const setFilter = (key: keyof EmployeeFilters, value: string | null) =>
    update({ ...filters, [key]: value ?? undefined, page: undefined })
  const debouncedSearch = useDebouncedCallback((q: string) => setFilter('q', q), 300)
  const hasFilters = Boolean(filters.q || filters.country || filters.department || filters.job_title)

  const total = employees.data?.meta.total ?? 0
  const page = employees.data?.meta.page ?? 1
  const from = total === 0 ? 0 : (page - 1) * PER_PAGE + 1
  const to = Math.min(page * PER_PAGE, total)

  return (
    <Stack>
      <Group justify="space-between">
        <div>
          <Title order={2}>Employees</Title>
          <Text c="dimmed" size="sm">
            {formatNumber(total)} {hasFilters ? 'matching' : 'total'}
          </Text>
        </div>
        {canManage && (
          <Button leftSection={<IconPlus size={16} />} onClick={openAdd} disabled={!meta.data}>
            Add employee
          </Button>
        )}
      </Group>

      <Paper withBorder p="md" radius="md">
        <Group grow align="flex-end" preventGrowOverflow={false} wrap="wrap">
          <TextInput
            key={hasFilters ? 'search' : 'search-reset'}
            label="Search"
            placeholder="Name, email or employee code"
            leftSection={<IconSearch size={16} />}
            defaultValue={filters.q ?? ''}
            onChange={(e) => debouncedSearch(e.currentTarget.value)}
            miw={240}
          />
          <Select
            label="Country"
            placeholder="All countries"
            clearable
            searchable
            data={meta.data?.countries.map((c) => ({ value: c.code, label: c.name })) ?? []}
            value={filters.country ?? null}
            onChange={(v) => setFilter('country', v)}
          />
          <Select
            label="Department"
            placeholder="All departments"
            clearable
            data={meta.data?.departments ?? []}
            value={filters.department ?? null}
            onChange={(v) => setFilter('department', v)}
          />
          <Select
            label="Job title"
            placeholder="All titles"
            clearable
            searchable
            data={meta.data?.job_titles ?? []}
            value={filters.job_title ?? null}
            onChange={(v) => setFilter('job_title', v)}
          />
          {hasFilters && (
            <Button variant="subtle" onClick={() => update({})} style={{ flexGrow: 0 }}>
              Clear filters
            </Button>
          )}
        </Group>
      </Paper>

      <QueryState isLoading={employees.isLoading} error={employees.error}>
        {() => (
          <Paper withBorder radius="md">
            <Table.ScrollContainer minWidth={900}>
              <Table highlightOnHover verticalSpacing="sm" style={{ opacity: employees.isPlaceholderData ? 0.6 : 1 }}>
                <Table.Thead>
                  <Table.Tr>
                    <SortableTh column="full_name" label="Name" filters={filters} onSort={update} />
                    <SortableTh column="job_title" label="Job title" filters={filters} onSort={update} />
                    <SortableTh column="department" label="Department" filters={filters} onSort={update} />
                    <SortableTh column="country_code" label="Country" filters={filters} onSort={update} />
                    <SortableTh column="salary" label="Salary" filters={filters} onSort={update} align="right" />
                    <SortableTh column="hire_date" label="Hired" filters={filters} onSort={update} />
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {employees.data?.data.map((e) => (
                    <Table.Tr key={e.id} onClick={() => navigate(`/employees/${e.id}`)} style={{ cursor: 'pointer' }}>
                      <Table.Td>
                        <Text size="sm" fw={500}>
                          {e.full_name}
                        </Text>
                        <Text size="xs" c="dimmed">
                          {e.employee_code} · {e.email}
                        </Text>
                      </Table.Td>
                      <Table.Td>
                        <Text size="sm">{e.job_title}</Text>
                        {e.employment_type !== 'full_time' && (
                          <Text size="xs" c="dimmed">
                            {formatEmploymentType(e.employment_type)}
                          </Text>
                        )}
                      </Table.Td>
                      <Table.Td>{e.department}</Table.Td>
                      <Table.Td>{e.country_code}</Table.Td>
                      <Table.Td ta="right" style={{ fontVariantNumeric: 'tabular-nums' }}>
                        {formatMoney(e.salary, e.currency)}
                      </Table.Td>
                      <Table.Td>{e.hire_date}</Table.Td>
                    </Table.Tr>
                  ))}
                </Table.Tbody>
              </Table>
            </Table.ScrollContainer>
            {total === 0 && (
              <Center p="xl">
                <Text c="dimmed">No employees match these filters.</Text>
              </Center>
            )}
            <Group justify="space-between" p="md">
              <Text size="sm" c="dimmed">
                Showing {formatNumber(from)}–{formatNumber(to)} of {formatNumber(total)}
              </Text>
              <Pagination
                total={employees.data?.meta.total_pages ?? 0}
                value={page}
                onChange={(p) => update({ ...filters, page: p })}
                size="sm"
              />
            </Group>
          </Paper>
        )}
      </QueryState>

      <Modal opened={addOpen} onClose={closeAdd} title="Add employee" size="lg">
        {meta.data && (
          <EmployeeForm
            meta={meta.data}
            submitLabel="Add employee"
            onCancel={closeAdd}
            onSubmit={async (input) => {
              const created = await createEmployee.mutateAsync(input)
              notifications.show({ color: 'teal', message: `${created.full_name} added` })
              closeAdd()
              navigate(`/employees/${created.id}`)
            }}
          />
        )}
      </Modal>
    </Stack>
  )
}

interface SortableThProps {
  column: string
  label: string
  filters: EmployeeFilters
  onSort: (next: EmployeeFilters) => void
  align?: 'right'
}

function SortableTh({ column, label, filters, onSort, align }: SortableThProps) {
  const active = (filters.sort ?? 'full_name') === column
  const Icon = !active ? IconSelector : filters.direction === 'desc' ? IconChevronDown : IconChevronUp
  return (
    <Table.Th ta={align}>
      <UnstyledButton onClick={() => onSort(nextSort(filters, column))} aria-label={`Sort by ${label}`}>
        <Group gap={4} justify={align === 'right' ? 'flex-end' : 'flex-start'} wrap="nowrap">
          <Text size="sm" fw={600}>
            {label}
          </Text>
          <Icon size={14} />
        </Group>
      </UnstyledButton>
    </Table.Th>
  )
}
