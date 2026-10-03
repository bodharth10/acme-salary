import { screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { renderWithProviders } from '../test/render'
import { PeerComparisonCard } from './PeerComparisonCard'

const comparison = {
  peer_group: 'Software Engineer in United States',
  peer_count: 40,
  median: 110000,
  p25: 105000,
  p75: 130000,
  compa_ratio: 0.91,
  percentile_rank: 20,
}

describe('PeerComparisonCard', () => {
  it('explains where the salary sits relative to peers', () => {
    renderWithProviders(<PeerComparisonCard salary={100000} currency="USD" comparison={comparison} />)

    expect(screen.getByTestId('compa-summary')).toHaveTextContent('9% below peer median')
    expect(screen.getByText('Below typical range')).toBeInTheDocument()
    expect(screen.getByText('$110,000')).toBeInTheDocument()
    expect(screen.getByText('Paid more than 20% of peers')).toBeInTheDocument()
  })

  it('says there is no benchmark when the employee has no peers', () => {
    renderWithProviders(
      <PeerComparisonCard salary={100000} currency="USD" comparison={{ ...comparison, peer_count: 1 }} />,
    )
    expect(screen.getByText(/no peer benchmark/)).toBeInTheDocument()
    expect(screen.queryByTestId('compa-summary')).not.toBeInTheDocument()
  })
})
