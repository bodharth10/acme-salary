// Currency formatting is locale-aware (Intl) and always shows the currency,
// because salaries in different countries are never directly comparable.

export function formatMoney(amount: number | null | undefined, currency: string): string {
  if (amount === null || amount === undefined) return '—'
  return new Intl.NumberFormat('en-US', { style: 'currency', currency, maximumFractionDigits: 0 }).format(amount)
}

export function formatCompactMoney(amount: number | null | undefined, currency: string): string {
  if (amount === null || amount === undefined) return '—'
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    notation: 'compact',
    minimumFractionDigits: 0,
    maximumFractionDigits: 1,
  }).format(amount)
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat('en-US').format(value)
}

const EMPLOYMENT_LABELS: Record<string, string> = {
  full_time: 'Full-time',
  part_time: 'Part-time',
  contractor: 'Contractor',
}

export function formatEmploymentType(type: string): string {
  return EMPLOYMENT_LABELS[type] ?? type
}

// Plain-language reading of a compa-ratio, e.g. 0.91 -> "9% below peer median".
export function describeCompaRatio(ratio: number | null | undefined): string {
  if (ratio === null || ratio === undefined) return 'No peers to compare with'
  const diff = Math.round((ratio - 1) * 100)
  if (diff === 0) return 'At peer median'
  return `${Math.abs(diff)}% ${diff > 0 ? 'above' : 'below'} peer median`
}

export type PayPosition = 'below' | 'within' | 'above'

// Flags pay outside the peer group's interquartile range (p25–p75).
export function payPosition(salary: number, p25: number | null, p75: number | null): PayPosition | null {
  if (p25 === null || p75 === null) return null
  if (salary < p25) return 'below'
  if (salary > p75) return 'above'
  return 'within'
}
