class Employee < ApplicationRecord
  SORTABLE_COLUMNS = %w[full_name job_title department country_code salary hire_date].freeze

  normalizes :email, with: ->(email) { email.strip.downcase }
  normalizes :full_name, :job_title, with: ->(value) { value.squish }
  normalizes :country_code, with: ->(code) { code.strip.upcase }

  before_validation :assign_employee_code, on: :create

  validates :employee_code, presence: true, uniqueness: true
  validates :full_name, presence: true, length: { maximum: 120 }
  validates :email, presence: true, uniqueness: true, format: { with: URI::MailTo::EMAIL_REGEXP }
  validates :job_title, presence: true, length: { maximum: 80 }
  validates :department, inclusion: { in: OrgCatalog::DEPARTMENTS }
  validates :country_code, inclusion: { in: Country.codes, message: "is not a country ACME operates in" }
  validates :employment_type, inclusion: { in: OrgCatalog::EMPLOYMENT_TYPES }
  validates :salary, numericality: { only_integer: true, greater_than: 0, less_than: 1_000_000_000 }
  validates :hire_date, presence: true
  validate :hire_date_not_in_future

  scope :in_country, ->(code) { where(country_code: code.to_s.upcase) }
  scope :search, lambda { |term|
    pattern = "%#{sanitize_sql_like(term.to_s.strip.downcase)}%"
    where("LOWER(full_name) LIKE :p OR email LIKE :p OR LOWER(employee_code) LIKE :p", p: pattern)
  }

  def country = Country.find_by(country_code)
  def currency = country&.currency

  private

  def assign_employee_code
    self.employee_code ||= "EMP-#{SecureRandom.alphanumeric(8).upcase}"
  end

  def hire_date_not_in_future
    errors.add(:hire_date, "can't be in the future") if hire_date&.future?
  end
end
