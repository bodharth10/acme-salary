import { BarChart } from '@mantine/charts'
import { Anchor, Group, Paper, Select, SimpleGrid, Stack, Tabs, Text, Title } from '@mantine/core'
import { IconArrowLeft } from '@tabler/icons-react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useCountryInsights, useMeta } from '../api/hooks'
import { GroupStatsTable } from '../components/GroupStatsTable'
import { QueryState } from '../components/QueryState'
import { StatCard } from '../components/StatCard'
import { filtersToSearchParams } from '../lib/filters'
import { formatCompactMoney, formatMoney, formatNumber } from '../lib/format'

export function CountryInsightsPage() {
  const code = useParams().code?.toUpperCase()
  const navigate = useNavigate()
  const meta = useMeta()
  const insights = useCountryInsights(code)

  const openEmployees = (filter: { department?: string; job_title?: string }) =>
    navigate(`/employees?${filtersToSearchParams({ country: code, ...filter })}`)

  return (
    <Stack>
      <Anchor component={Link} to="/insights" size="sm">
        <Group gap={4}>
          <IconArrowLeft size={14} /> All countries
        </Group>
      </Anchor>

      <Group justify="space-between" align="flex-end">
        <Title order={2}>{insights.data?.name ?? code} pay</Title>
        <Select
          aria-label="Country"
          data={meta.data?.countries.map((c) => ({ value: c.code, label: c.name })) ?? []}
          value={code ?? null}
          onChange={(v) => v && navigate(`/insights/${v}`)}
          allowDeselect={false}
          searchable
          w={220}
        />
      </Group>

      <QueryState isLoading={insights.isLoading} error={insights.error}>
        {() => {
          const data = insights.data!
          const { stats, currency } = data
          return (
            <>
              <SimpleGrid cols={{ base: 2, md: 4 }}>
                <StatCard label="Headcount" value={formatNumber(stats.count)} />
                <StatCard label="Median salary" value={formatMoney(stats.median, currency)} hint={`Mean ${formatMoney(stats.mean, currency)}`} />
                <StatCard
                  label="Typical range"
                  value={`${formatCompactMoney(stats.p25, currency)} – ${formatCompactMoney(stats.p75, currency)}`}
                  hint="Middle 50% of employees (p25–p75)"
                />
                <StatCard
                  label="Full range"
                  value={`${formatCompactMoney(stats.min, currency)} – ${formatCompactMoney(stats.max, currency)}`}
                />
              </SimpleGrid>

              {stats.count > 0 && (
                <Paper withBorder p="lg" radius="md">
                  <Text fw={600} mb="md">
                    Salary distribution ({currency})
                  </Text>
                  <BarChart
                    h={240}
                    data={data.histogram.map((b) => ({
                      band: formatCompactMoney(b.from, currency),
                      Employees: b.count,
                    }))}
                    dataKey="band"
                    series={[{ name: 'Employees', color: 'indigo.6' }]}
                    tickLine="none"
                    gridAxis="y"
                  />
                </Paper>
              )}

              <Paper withBorder p="md" radius="md">
                <Tabs defaultValue="department">
                  <Tabs.List mb="sm">
                    <Tabs.Tab value="department">By department</Tabs.Tab>
                    <Tabs.Tab value="title">By job title</Tabs.Tab>
                  </Tabs.List>
                  <Tabs.Panel value="department">
                    <GroupStatsTable
                      label="Department"
                      groups={data.by_department}
                      currency={currency}
                      onSelect={(department) => openEmployees({ department })}
                    />
                  </Tabs.Panel>
                  <Tabs.Panel value="title">
                    <GroupStatsTable
                      label="Job title"
                      groups={data.by_job_title}
                      currency={currency}
                      onSelect={(job_title) => openEmployees({ job_title })}
                    />
                  </Tabs.Panel>
                </Tabs>
                <Text size="xs" c="dimmed" mt="sm">
                  Click a row to see the people behind the numbers.
                </Text>
              </Paper>
            </>
          )
        }}
      </QueryState>
    </Stack>
  )
}
