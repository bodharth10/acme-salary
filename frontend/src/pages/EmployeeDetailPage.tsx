import { Anchor, Badge, Button, Grid, Group, Modal, Paper, SimpleGrid, Stack, Text, Title } from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'
import { notifications } from '@mantine/notifications'
import { IconArrowLeft, IconPencil, IconTrash } from '@tabler/icons-react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useCanManageEmployees, useDeleteEmployee, useEmployee, useMeta, useUpdateEmployee } from '../api/hooks'
import { EmployeeForm } from '../components/EmployeeForm'
import { PeerComparisonCard } from '../components/PeerComparisonCard'
import { QueryState } from '../components/QueryState'
import { fromEmployee } from '../lib/employeeForm'
import { formatEmploymentType, formatMoney } from '../lib/format'

export function EmployeeDetailPage() {
  const id = Number(useParams().id)
  const navigate = useNavigate()
  const meta = useMeta()
  const employee = useEmployee(id)
  const updateEmployee = useUpdateEmployee(id)
  const deleteEmployee = useDeleteEmployee()
  const canManage = useCanManageEmployees()
  const [editOpen, edit] = useDisclosure(false)
  const [deleteOpen, del] = useDisclosure(false)

  const countryName = (code: string) => meta.data?.countries.find((c) => c.code === code)?.name ?? code

  return (
    <Stack>
      <Anchor component={Link} to="/employees" size="sm">
        <Group gap={4}>
          <IconArrowLeft size={14} /> All employees
        </Group>
      </Anchor>

      <QueryState isLoading={employee.isLoading} error={employee.error}>
        {() => {
          const e = employee.data!
          return (
            <>
              <Group justify="space-between" align="flex-start">
                <div>
                  <Title order={2}>{e.full_name}</Title>
                  <Group gap="xs" mt={4}>
                    <Badge variant="light">{e.job_title}</Badge>
                    <Badge variant="light" color="gray">
                      {e.department}
                    </Badge>
                    <Badge variant="light" color="grape">
                      {countryName(e.country_code)}
                    </Badge>
                  </Group>
                </div>
                {canManage && (
                  <Group>
                    <Button variant="default" leftSection={<IconPencil size={16} />} onClick={edit.open}>
                      Edit
                    </Button>
                    <Button color="red" variant="light" leftSection={<IconTrash size={16} />} onClick={del.open}>
                      Delete
                    </Button>
                  </Group>
                )}
              </Group>

              <Grid>
                <Grid.Col span={{ base: 12, md: 5 }}>
                  <Paper withBorder p="lg" radius="md">
                    <SimpleGrid cols={2} spacing="md">
                      <Field label="Annual salary" value={formatMoney(e.salary, e.currency)} />
                      <Field label="Currency" value={e.currency} />
                      <Field label="Employee code" value={e.employee_code} />
                      <Field label="Employment" value={formatEmploymentType(e.employment_type)} />
                      <Field label="Hire date" value={e.hire_date} />
                      <Field label="Email" value={e.email} />
                    </SimpleGrid>
                  </Paper>
                </Grid.Col>
                <Grid.Col span={{ base: 12, md: 7 }}>
                  <PeerComparisonCard salary={e.salary} currency={e.currency} comparison={e.peer_comparison} />
                </Grid.Col>
              </Grid>

              <Modal opened={editOpen} onClose={edit.close} title={`Edit ${e.full_name}`} size="lg">
                {meta.data && (
                  <EmployeeForm
                    meta={meta.data}
                    initialValues={fromEmployee(e)}
                    submitLabel="Save changes"
                    onCancel={edit.close}
                    onSubmit={async (input) => {
                      await updateEmployee.mutateAsync(input)
                      notifications.show({ color: 'teal', message: 'Changes saved' })
                      edit.close()
                    }}
                  />
                )}
              </Modal>

              <Modal opened={deleteOpen} onClose={del.close} title="Delete employee?">
                <Text size="sm">
                  This permanently removes {e.full_name} ({e.employee_code}) and their salary record.
                </Text>
                <Group justify="flex-end" mt="lg">
                  <Button variant="default" onClick={del.close}>
                    Cancel
                  </Button>
                  <Button
                    color="red"
                    loading={deleteEmployee.isPending}
                    onClick={async () => {
                      await deleteEmployee.mutateAsync(e.id)
                      notifications.show({ message: `${e.full_name} deleted` })
                      navigate('/employees')
                    }}
                  >
                    Delete
                  </Button>
                </Group>
              </Modal>
            </>
          )
        }}
      </QueryState>
    </Stack>
  )
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <Text size="xs" c="dimmed">
        {label}
      </Text>
      <Text size="sm" fw={500} style={{ wordBreak: 'break-word' }}>
        {value}
      </Text>
    </div>
  )
}
