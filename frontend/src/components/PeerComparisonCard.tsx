import { Badge, Group, Paper, Progress, Stack, Text, Title } from '@mantine/core'
import type { PeerComparison } from '../api/types'
import { describeCompaRatio, formatMoney, payPosition } from '../lib/format'

const POSITION_BADGE = {
  below: { color: 'orange', label: 'Below typical range' },
  within: { color: 'teal', label: 'Within typical range' },
  above: { color: 'blue', label: 'Above typical range' },
} as const

interface Props {
  salary: number
  currency: string
  comparison: PeerComparison
}

export function PeerComparisonCard({ salary, currency, comparison }: Props) {
  const position = payPosition(salary, comparison.p25, comparison.p75)
  const alone = comparison.peer_count <= 1

  return (
    <Paper withBorder p="lg" radius="md">
      <Stack gap="sm">
        <Group justify="space-between">
          <Title order={4}>Pay vs. peers</Title>
          {position && !alone && (
            <Badge color={POSITION_BADGE[position].color} variant="light">
              {POSITION_BADGE[position].label}
            </Badge>
          )}
        </Group>
        <Text size="sm" c="dimmed">
          {comparison.peer_group} · {comparison.peer_count} {comparison.peer_count === 1 ? 'person' : 'people'}
        </Text>

        {alone ? (
          <Text size="sm">This is the only person with this title in this country, so there is no peer benchmark.</Text>
        ) : (
          <>
            <Text fw={600} data-testid="compa-summary">
              {describeCompaRatio(comparison.compa_ratio)}
            </Text>
            <Group gap="xl">
              <Metric label="Peer median" value={formatMoney(comparison.median, currency)} />
              <Metric
                label="Typical range (p25–p75)"
                value={`${formatMoney(comparison.p25, currency)} – ${formatMoney(comparison.p75, currency)}`}
              />
              <Metric label="Compa-ratio" value={comparison.compa_ratio?.toFixed(2) ?? '—'} />
            </Group>
            {comparison.percentile_rank !== null && (
              <div>
                <Text size="xs" c="dimmed" mb={4}>
                  Paid more than {comparison.percentile_rank}% of peers
                </Text>
                <Progress value={comparison.percentile_rank} aria-label="Percentile among peers" />
              </div>
            )}
            <Text size="xs" c="dimmed">
              Current salary: {formatMoney(salary, currency)}
            </Text>
          </>
        )}
      </Stack>
    </Paper>
  )
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <Text size="xs" c="dimmed">
        {label}
      </Text>
      <Text fw={600}>{value}</Text>
    </div>
  )
}
