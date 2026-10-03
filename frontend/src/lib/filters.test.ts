import { describe, expect, it } from 'vitest'
import { filtersFromSearchParams, filtersToSearchParams, nextSort } from './filters'

describe('filters <-> URL', () => {
  it('reads known filters and ignores junk', () => {
    const params = new URLSearchParams('q=jane&country=IN&direction=sideways&page=abc&unknown=1')
    expect(filtersFromSearchParams(params)).toEqual({ q: 'jane', country: 'IN' })
  })

  it('round-trips filters, omitting defaults', () => {
    const filters = { country: 'US', sort: 'salary', direction: 'desc' as const, page: 3 }
    expect(filtersFromSearchParams(filtersToSearchParams(filters))).toEqual(filters)
    expect(filtersToSearchParams({ page: 1, q: '' }).toString()).toBe('')
  })
})

describe('nextSort', () => {
  it('sorts ascending first, then toggles to descending, and resets the page', () => {
    const asc = nextSort({ page: 4 }, 'salary')
    expect(asc).toMatchObject({ sort: 'salary', direction: 'asc', page: undefined })
    expect(nextSort(asc, 'salary')).toMatchObject({ direction: 'desc' })
    expect(nextSort({ sort: 'salary', direction: 'desc' }, 'hire_date')).toMatchObject({ direction: 'asc' })
  })
})
