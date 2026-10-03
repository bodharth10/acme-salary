import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from './client'
import type { EmployeeFilters, EmployeeInput } from './types'

export const queryKeys = {
  meta: ['meta'] as const,
  employees: (filters: EmployeeFilters) => ['employees', filters] as const,
  employee: (id: number) => ['employee', id] as const,
  overview: ['insights', 'overview'] as const,
  country: (code: string) => ['insights', 'country', code] as const,
}

export const useMeta = () =>
  useQuery({ queryKey: queryKeys.meta, queryFn: api.meta, staleTime: Infinity })

export const useEmployees = (filters: EmployeeFilters) =>
  useQuery({
    queryKey: queryKeys.employees(filters),
    queryFn: () => api.listEmployees(filters),
    // Keep showing the current page while the next one loads: no table flicker.
    placeholderData: keepPreviousData,
  })

export const useEmployee = (id: number) =>
  useQuery({ queryKey: queryKeys.employee(id), queryFn: () => api.getEmployee(id) })

export const useOverview = () => useQuery({ queryKey: queryKeys.overview, queryFn: api.overview })

export const useCountryInsights = (code: string | undefined) =>
  useQuery({
    queryKey: queryKeys.country(code ?? ''),
    queryFn: () => api.countryInsights(code!),
    enabled: Boolean(code),
  })

// Any write can change lists, peer comparisons and insights, so invalidate
// broadly. With 10k rows the refetch cost is negligible and it can't go stale.
function useInvalidateAll() {
  const client = useQueryClient()
  return () =>
    Promise.all(
      ['employees', 'employee', 'insights', 'meta'].map((key) => client.invalidateQueries({ queryKey: [key] })),
    )
}

export function useCreateEmployee() {
  const invalidate = useInvalidateAll()
  return useMutation({ mutationFn: (input: EmployeeInput) => api.createEmployee(input), onSuccess: invalidate })
}

export function useUpdateEmployee(id: number) {
  const invalidate = useInvalidateAll()
  return useMutation({
    mutationFn: (input: Partial<EmployeeInput>) => api.updateEmployee(id, input),
    onSuccess: invalidate,
  })
}

export function useDeleteEmployee() {
  const invalidate = useInvalidateAll()
  return useMutation({ mutationFn: (id: number) => api.deleteEmployee(id), onSuccess: invalidate })
}
