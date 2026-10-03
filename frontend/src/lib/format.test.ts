import { describe, expect, it } from 'vitest'
import { describeCompaRatio, formatCompactMoney, formatEmploymentType, formatMoney, payPosition } from './format'

describe('formatMoney', () => {
  it('formats in the given currency with no decimals', () => {
    expect(formatMoney(125000, 'USD')).toBe('$125,000')
    expect(formatMoney(1900000, 'INR')).toBe('₹1,900,000')
    expect(formatMoney(7200000, 'JPY')).toBe('¥7,200,000')
  })

  it('shows a dash for missing values', () => {
    expect(formatMoney(null, 'USD')).toBe('—')
  })
})

describe('formatCompactMoney', () => {
  it('abbreviates large amounts', () => {
    expect(formatCompactMoney(125000, 'USD')).toBe('$125K')
    expect(formatCompactMoney(1_900_000, 'EUR')).toBe('€1.9M')
  })
})

describe('describeCompaRatio', () => {
  it('describes pay relative to the peer median in plain language', () => {
    expect(describeCompaRatio(0.91)).toBe('9% below peer median')
    expect(describeCompaRatio(1.15)).toBe('15% above peer median')
    expect(describeCompaRatio(1)).toBe('At peer median')
    expect(describeCompaRatio(null)).toBe('No peers to compare with')
  })
})

describe('payPosition', () => {
  it('classifies salary against the interquartile range', () => {
    expect(payPosition(90, 100, 200)).toBe('below')
    expect(payPosition(150, 100, 200)).toBe('within')
    expect(payPosition(201, 100, 200)).toBe('above')
    expect(payPosition(150, null, null)).toBeNull()
  })
})

describe('formatEmploymentType', () => {
  it('maps API values to labels', () => {
    expect(formatEmploymentType('part_time')).toBe('Part-time')
  })
})
