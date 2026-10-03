import { describe, expect, it } from 'vitest'
import { employeeValidation, fromEmployee, todayISO, toEmployeeInput, type EmployeeFormValues } from './employeeForm'

describe('employeeValidation', () => {
  it('requires a positive whole-number salary', () => {
    expect(employeeValidation.salary('')).toBe('Salary is required')
    expect(employeeValidation.salary(0)).toBe('Salary must be a positive whole number')
    expect(employeeValidation.salary(10.5)).toBe('Salary must be a positive whole number')
    expect(employeeValidation.salary(50000)).toBeNull()
  })

  it('validates email shape', () => {
    expect(employeeValidation.email('nope')).toBe('Enter a valid email')
    expect(employeeValidation.email(' jane@acme.example ')).toBeNull()
  })

  it('rejects hire dates in the future', () => {
    expect(employeeValidation.hire_date('2999-01-01')).toBe('Hire date cannot be in the future')
    expect(employeeValidation.hire_date(todayISO())).toBeNull()
    expect(employeeValidation.hire_date('')).toBe('Hire date is required')
  })
})

describe('todayISO', () => {
  it('formats a local date as YYYY-MM-DD', () => {
    expect(todayISO(new Date(2026, 0, 5))).toBe('2026-01-05')
  })
})

describe('toEmployeeInput / fromEmployee', () => {
  const values: EmployeeFormValues = {
    full_name: '  Jane Doe ',
    email: ' jane@acme.example',
    job_title: 'Recruiter ',
    department: 'People',
    country_code: 'GB',
    employment_type: 'full_time',
    salary: 52000,
    hire_date: '2023-03-01',
  }

  it('trims text and converts salary to a number', () => {
    expect(toEmployeeInput(values)).toEqual({
      ...values,
      full_name: 'Jane Doe',
      email: 'jane@acme.example',
      job_title: 'Recruiter',
      salary: 52000,
    })
  })

  it('round-trips an employee into form values', () => {
    const input = toEmployeeInput(values)
    expect(toEmployeeInput(fromEmployee(input))).toEqual(input)
  })
})
