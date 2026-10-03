import type { EmployeeFilters } from '../api/types'

const STRING_KEYS = ['q', 'country', 'department', 'job_title', 'sort'] as const

// Filters live in the URL so a filtered view can be refreshed, bookmarked
// or shared with a colleague.
export function filtersFromSearchParams(params: URLSearchParams): EmployeeFilters {
  const filters: EmployeeFilters = {}
  STRING_KEYS.forEach((key) => {
    const value = params.get(key)
    if (value) filters[key] = value
  })
  const direction = params.get('direction')
  if (direction === 'asc' || direction === 'desc') filters.direction = direction
  const page = Number(params.get('page'))
  if (Number.isInteger(page) && page > 1) filters.page = page
  return filters
}

export function filtersToSearchParams(filters: EmployeeFilters): URLSearchParams {
  const params = new URLSearchParams()
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== '' && !(key === 'page' && value === 1)) params.set(key, String(value))
  })
  return params
}

// Clicking a column header: first click sorts ascending, second descending.
export function nextSort(filters: EmployeeFilters, column: string): EmployeeFilters {
  const direction = filters.sort === column && filters.direction !== 'desc' ? 'desc' : 'asc'
  return { ...filters, sort: column, direction, page: undefined }
}
