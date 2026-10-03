import { Autocomplete, Button, Group, NumberInput, Select, SimpleGrid, TextInput } from '@mantine/core'
import { useForm } from '@mantine/form'
import { ApiError } from '../api/client'
import type { EmployeeInput, Meta } from '../api/types'
import {
  emptyEmployee,
  employeeValidation,
  todayISO,
  toEmployeeInput,
  type EmployeeFormValues,
} from '../lib/employeeForm'
import { formatEmploymentType } from '../lib/format'

interface Props {
  meta: Meta
  initialValues?: EmployeeFormValues
  submitLabel: string
  onSubmit: (input: EmployeeInput) => Promise<unknown>
  onCancel?: () => void
}

export function EmployeeForm({ meta, initialValues = emptyEmployee, submitLabel, onSubmit, onCancel }: Props) {
  const form = useForm<EmployeeFormValues>({ initialValues, validate: employeeValidation })

  const currency = meta.countries.find((c) => c.code === form.values.country_code)?.currency

  const handleSubmit = async (values: EmployeeFormValues) => {
    try {
      await onSubmit(toEmployeeInput(values))
    } catch (error) {
      // Surface server-side validation (e.g. duplicate email) on the fields.
      if (error instanceof ApiError && Object.keys(error.fieldErrors).length > 0) {
        form.setErrors(
          Object.fromEntries(Object.entries(error.fieldErrors).map(([field, messages]) => [field, messages[0]])),
        )
      } else {
        throw error
      }
    }
  }

  return (
    <form onSubmit={form.onSubmit(handleSubmit)} noValidate>
      <SimpleGrid cols={{ base: 1, sm: 2 }}>
        <TextInput label="Full name" withAsterisk {...form.getInputProps('full_name')} />
        <TextInput label="Work email" type="email" withAsterisk {...form.getInputProps('email')} />
        <Select
          label="Department"
          withAsterisk
          data={meta.departments}
          {...form.getInputProps('department')}
        />
        <Autocomplete
          label="Job title"
          withAsterisk
          data={meta.job_titles}
          limit={20}
          {...form.getInputProps('job_title')}
        />
        <Select
          label="Country"
          withAsterisk
          searchable
          data={meta.countries.map((c) => ({ value: c.code, label: `${c.name} (${c.currency})` }))}
          {...form.getInputProps('country_code')}
        />
        <NumberInput
          label="Annual salary"
          description={currency ? `In ${currency}, the currency of the selected country` : 'Select a country first'}
          withAsterisk
          min={1}
          allowDecimal={false}
          allowNegative={false}
          thousandSeparator=","
          rightSection={currency}
          rightSectionWidth={50}
          {...form.getInputProps('salary')}
        />
        <Select
          label="Employment type"
          data={meta.employment_types.map((t) => ({ value: t, label: formatEmploymentType(t) }))}
          allowDeselect={false}
          {...form.getInputProps('employment_type')}
        />
        <TextInput label="Hire date" type="date" max={todayISO()} withAsterisk {...form.getInputProps('hire_date')} />
      </SimpleGrid>
      <Group justify="flex-end" mt="lg">
        {onCancel && (
          <Button variant="default" onClick={onCancel}>
            Cancel
          </Button>
        )}
        <Button type="submit" loading={form.submitting}>
          {submitLabel}
        </Button>
      </Group>
    </form>
  )
}
