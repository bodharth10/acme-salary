import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { ApiError } from '../api/client'
import type { Meta } from '../api/types'
import { renderWithProviders } from '../test/render'
import { fromEmployee } from '../lib/employeeForm'
import { EmployeeForm } from './EmployeeForm'

const meta: Meta = {
  countries: [
    { code: 'US', name: 'United States', currency: 'USD' },
    { code: 'IN', name: 'India', currency: 'INR' },
  ],
  departments: ['Engineering', 'Sales'],
  job_titles: ['Software Engineer'],
  employment_types: ['full_time', 'part_time', 'contractor'],
}

const existing = fromEmployee({
  full_name: 'Jane Doe',
  email: 'jane@acme.example',
  job_title: 'Software Engineer',
  department: 'Engineering',
  country_code: 'IN',
  employment_type: 'full_time',
  salary: 2000000,
  hire_date: '2021-06-01',
})

describe('EmployeeForm', () => {
  it('blocks submission and shows errors when required fields are empty', async () => {
    const onSubmit = vi.fn()
    renderWithProviders(<EmployeeForm meta={meta} submitLabel="Save" onSubmit={onSubmit} />)

    await userEvent.click(screen.getByRole('button', { name: 'Save' }))

    expect(await screen.findByText('Name is required')).toBeInTheDocument()
    expect(screen.getByText('Salary is required')).toBeInTheDocument()
    expect(onSubmit).not.toHaveBeenCalled()
  })

  it('shows the currency of the selected country next to the salary', () => {
    renderWithProviders(<EmployeeForm meta={meta} initialValues={existing} submitLabel="Save" onSubmit={vi.fn()} />)
    expect(screen.getByText('In INR, the currency of the selected country')).toBeInTheDocument()
  })

  it('submits cleaned values', async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined)
    renderWithProviders(<EmployeeForm meta={meta} initialValues={existing} submitLabel="Save" onSubmit={onSubmit} />)

    const name = screen.getByLabelText(/Full name/)
    await userEvent.clear(name)
    await userEvent.type(name, '  Jane Smith ')
    await userEvent.click(screen.getByRole('button', { name: 'Save' }))

    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1))
    expect(onSubmit.mock.calls[0][0]).toMatchObject({ full_name: 'Jane Smith', salary: 2000000, country_code: 'IN' })
  })

  it('maps server validation errors onto fields', async () => {
    const onSubmit = vi.fn().mockRejectedValue(new ApiError(422, 'invalid', { email: ['has already been taken'] }))
    renderWithProviders(<EmployeeForm meta={meta} initialValues={existing} submitLabel="Save" onSubmit={onSubmit} />)

    await userEvent.click(screen.getByRole('button', { name: 'Save' }))

    expect(await screen.findByText('has already been taken')).toBeInTheDocument()
  })
})
