import type { EmployeeInput } from '../api/types'

// Salary is '' while the field is empty; hire_date is an ISO 'YYYY-MM-DD'
// string (native date input), which avoids timezone conversion bugs.
export type EmployeeFormValues = Omit<EmployeeInput, 'salary'> & { salary: number | '' }

export const emptyEmployee: EmployeeFormValues = {
  full_name: '',
  email: '',
  job_title: '',
  department: '',
  country_code: '',
  employment_type: 'full_time',
  salary: '',
  hire_date: '',
}

export function todayISO(now: Date = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`
}

// Client-side rules mirror the server's model validations so HR gets
// instant feedback; the server remains the source of truth.
export const employeeValidation = {
  full_name: (v: string) => (v.trim() ? null : 'Name is required'),
  email: (v: string) => (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()) ? null : 'Enter a valid email'),
  job_title: (v: string) => (v.trim() ? null : 'Job title is required'),
  department: (v: string) => (v ? null : 'Department is required'),
  country_code: (v: string) => (v ? null : 'Country is required'),
  salary: (v: number | '') =>
    v === '' ? 'Salary is required' : !Number.isInteger(v) || v <= 0 ? 'Salary must be a positive whole number' : null,
  hire_date: (v: string) =>
    !v ? 'Hire date is required' : v > todayISO() ? 'Hire date cannot be in the future' : null,
}

export function toEmployeeInput(values: EmployeeFormValues): EmployeeInput {
  return {
    ...values,
    full_name: values.full_name.trim(),
    email: values.email.trim(),
    job_title: values.job_title.trim(),
    salary: Number(values.salary),
  }
}

export function fromEmployee(employee: EmployeeInput): EmployeeFormValues {
  const { full_name, email, job_title, department, country_code, employment_type, salary, hire_date } = employee
  return { full_name, email, job_title, department, country_code, employment_type, salary, hire_date }
}
