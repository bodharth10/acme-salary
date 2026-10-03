import { Alert, Paper, SimpleGrid, Stack, Table, Text, Title } from '@mantine/core'
import { IconInfoCircle } from '@tabler/icons-react'
import { useNavigate } from 'react-router-dom'
import { useOverview } from '../api/hooks'
import { QueryState } from '../components/QueryState'
import { StatCard } from '../components/StatCard'
import { formatMoney, formatNumber } from '../lib/format'

export function InsightsPage() {
  const overview = useOverview()
  const navigate = useNavigate()

  return (
    <Stack>
      <div>
        <Title order={2}>Pay insights</Title>
        <Text c="dimmed" size="sm">
          How ACME pays people, country by country.
        </Text>
      </div>

      <QueryState isLoading={overview.isLoading} error={overview.error}>
        {() => {
          const data = overview.data!
          return (
            <>
              <SimpleGrid cols={{ base: 1, sm: 3 }}>
                <StatCard label="Headcount" value={formatNumber(data.headcount)} />
                <StatCard label="Countries" value={data.countries.length} />
                <StatCard label="Departments" value={data.department_count} />
              </SimpleGrid>

              <Alert variant="light" icon={<IconInfoCircle />}>
                Figures are in each country's local currency and are not converted, so compare within a
                country rather than across countries. Select a country for a breakdown.
              </Alert>

              <Paper withBorder radius="md">
                <Table.ScrollContainer minWidth={760}>
                  <Table highlightOnHover verticalSpacing="sm">
                    <Table.Thead>
                      <Table.Tr>
                        <Table.Th>Country</Table.Th>
                        <Table.Th ta="right">Headcount</Table.Th>
                        <Table.Th ta="right">Median</Table.Th>
                        <Table.Th ta="right">Typical range (p25–p75)</Table.Th>
                        <Table.Th ta="right">Mean</Table.Th>
                        <Table.Th ta="right">Min – Max</Table.Th>
                      </Table.Tr>
                    </Table.Thead>
                    <Table.Tbody>
                      {data.countries.map((c) => (
                        <Table.Tr key={c.code} onClick={() => navigate(`/insights/${c.code}`)} style={{ cursor: 'pointer' }}>
                          <Table.Td>
                            <Text size="sm" fw={500}>
                              {c.name}
                            </Text>
                            <Text size="xs" c="dimmed">
                              {c.currency}
                            </Text>
                          </Table.Td>
                          <Table.Td ta="right">{formatNumber(c.stats.count)}</Table.Td>
                          <Table.Td ta="right" fw={600}>
                            {formatMoney(c.stats.median, c.currency)}
                          </Table.Td>
                          <Table.Td ta="right">
                            {formatMoney(c.stats.p25, c.currency)} – {formatMoney(c.stats.p75, c.currency)}
                          </Table.Td>
                          <Table.Td ta="right">{formatMoney(c.stats.mean, c.currency)}</Table.Td>
                          <Table.Td ta="right">
                            {formatMoney(c.stats.min, c.currency)} – {formatMoney(c.stats.max, c.currency)}
                          </Table.Td>
                        </Table.Tr>
                      ))}
                    </Table.Tbody>
                  </Table>
                </Table.ScrollContainer>
              </Paper>
            </>
          )
        }}
      </QueryState>
    </Stack>
  )
}
