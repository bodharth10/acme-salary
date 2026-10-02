# Single place that decides the employee JSON shape, so the API contract is
# explicit and does not change by accident when a column is added.
class EmployeeSerializer
  FIELDS = %i[id employee_code full_name email job_title department country_code employment_type salary hire_date].freeze

  def self.render(employee, **extra)
    employee.slice(*FIELDS).symbolize_keys.merge(currency: employee.currency, **extra)
  end
end
