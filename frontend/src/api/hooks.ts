import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from './client'
import type { EmployeeFilters, EmployeeInput } from './types'

export const queryKeys = {
  session: ['session'] as const,
  meta: ['meta'] as const,
  employees: (filters: EmployeeFilters) => ['employees', filters] as const,
  employee: (id: number) => ['employee', id] as const,
  overview: ['insights', 'overview'] as const,
  country: (code: string) => ['insights', 'country', code] as const,
}

// Asked once on load; kept fresh by sign-in, sign-out and 401 handling.
export const useSession = () =>
  useQuery({ queryKey: queryKeys.session, queryFn: api.session, staleTime: Infinity, retry: false })

export function useSignIn() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: ({ email, password }: { email: string; password: string }) => api.signIn(email, password),
    onSuccess: (session) => client.setQueryData(queryKeys.session, session),
  })
}

export function useSignOut() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: api.signOut,
    onSuccess: (session) => {
      client.setQueryData(queryKeys.session, session)
      // Drop every cached salary figure. The session query itself must stay:
      // the app shell is subscribed to it and switches to the login page.
      client.removeQueries({ predicate: (query) => query.queryKey[0] !== queryKeys.session[0] })
    },
  })
}

// UI convenience only: the server enforces the same rule on every write.
export function useCanManageEmployees(): boolean {
  return useSession().data?.user?.permissions.manage_employees ?? false
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
