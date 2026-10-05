export type EmploymentType = 'full_time' | 'part_time' | 'contractor'

export type Role = 'hr_manager' | 'viewer'

export interface User {
  id: number
  name: string
  email: string
  role: Role
  permissions: { manage_employees: boolean }
}

// `user` is null when nobody is signed in. The CSRF token must accompany
// every state-changing request.
export interface Session {
  user: User | null
  csrf_token: string
}

export interface Country {
  code: string
  name: string
  currency: string
}

export interface Meta {
  countries: Country[]
  departments: string[]
  job_titles: string[]
  employment_types: EmploymentType[]
}

export interface Employee {
  id: number
  employee_code: string
  full_name: string
  email: string
  job_title: string
  department: string
  country_code: string
  employment_type: EmploymentType
  salary: number
  hire_date: string
  currency: string
}

export interface PeerComparison {
  peer_group: string
  peer_count: number
  median: number | null
  p25: number | null
  p75: number | null
  compa_ratio: number | null
  percentile_rank: number | null
}

export interface EmployeeDetail extends Employee {
  peer_comparison: PeerComparison
}

export type EmployeeInput = Omit<Employee, 'id' | 'employee_code' | 'currency'>

export interface Paginated<T> {
  data: T[]
  meta: { total: number; page: number; per_page: number; total_pages: number }
}

export interface EmployeeFilters {
  q?: string
  country?: string
  department?: string
  job_title?: string
  sort?: string
  direction?: 'asc' | 'desc'
  page?: number
  per_page?: number
}

export interface Stats {
  count: number
  min: number | null
  max: number | null
  mean: number | null
  median: number | null
  p25: number | null
  p75: number | null
}

export interface CountryStats extends Country {
  stats: Stats
}

export interface Overview {
  headcount: number
  department_count: number
  countries: CountryStats[]
}

export interface GroupStats {
  name: string
  stats: Stats
}

export interface CountryInsights extends CountryStats {
  histogram: { from: number; to: number; count: number }[]
  by_department: GroupStats[]
  by_job_title: GroupStats[]
}
