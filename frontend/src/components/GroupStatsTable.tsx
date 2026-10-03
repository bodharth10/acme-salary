import { Table, Text } from '@mantine/core'
import type { GroupStats } from '../api/types'
import { formatMoney } from '../lib/format'

interface Props {
  groups: GroupStats[]
  currency: string
  label: string
  onSelect?: (name: string) => void
}

export function GroupStatsTable({ groups, currency, label, onSelect }: Props) {
  return (
    <Table.ScrollContainer minWidth={640}>
      <Table striped highlightOnHover={Boolean(onSelect)} verticalSpacing="xs">
        <Table.Thead>
          <Table.Tr>
            <Table.Th>{label}</Table.Th>
            <Table.Th ta="right">Headcount</Table.Th>
            <Table.Th ta="right">Min</Table.Th>
            <Table.Th ta="right">p25</Table.Th>
            <Table.Th ta="right">Median</Table.Th>
            <Table.Th ta="right">p75</Table.Th>
            <Table.Th ta="right">Max</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {groups.map(({ name, stats }) => (
            <Table.Tr
              key={name}
              onClick={onSelect ? () => onSelect(name) : undefined}
              style={onSelect ? { cursor: 'pointer' } : undefined}
            >
              <Table.Td>
                <Text size="sm" fw={500}>
                  {name}
                </Text>
              </Table.Td>
              <Table.Td ta="right">{stats.count}</Table.Td>
              <Table.Td ta="right">{formatMoney(stats.min, currency)}</Table.Td>
              <Table.Td ta="right">{formatMoney(stats.p25, currency)}</Table.Td>
              <Table.Td ta="right" fw={600}>
                {formatMoney(stats.median, currency)}
              </Table.Td>
              <Table.Td ta="right">{formatMoney(stats.p75, currency)}</Table.Td>
              <Table.Td ta="right">{formatMoney(stats.max, currency)}</Table.Td>
            </Table.Tr>
          ))}
        </Table.Tbody>
      </Table>
    </Table.ScrollContainer>
  )
}
