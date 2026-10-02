# Generates a realistic, *deterministic* employee population. The same
# `seed` always produces the same rows, so demos, screenshots and tests are
# reproducible.
#
# Salary = country base (local currency) x title multiplier x noise x tenure.
# Uses insert_all in batches: 10k rows insert in about a second instead of
# the ~30s that 10k individual `create!` calls with validations would take.
class EmployeeSeeder
  BATCH_SIZE = 1_000
  REFERENCE_DATE = Date.new(2026, 9, 30) # fixed so output never drifts with the clock
  EARLIEST_HIRE = Date.new(2008, 1, 1)

  # Typical annual salary for a mid-level Software Engineer, local currency.
  COUNTRY_BASE = {
    "US" => 125_000, "GB" => 68_000, "DE" => 72_000, "FR" => 56_000, "IN" => 1_900_000,
    "CA" => 105_000, "AU" => 115_000, "SG" => 95_000, "BR" => 160_000, "JP" => 7_200_000
  }.freeze

  COUNTRY_WEIGHTS = {
    "US" => 30, "IN" => 20, "GB" => 10, "DE" => 8, "CA" => 7,
    "BR" => 6, "FR" => 5, "AU" => 5, "SG" => 5, "JP" => 4
  }.freeze

  DEPARTMENT_WEIGHTS = {
    "Engineering" => 35, "Sales" => 18, "Operations" => 17, "Marketing" => 9,
    "Product" => 8, "Finance" => 7, "People" => 6
  }.freeze

  TITLE_MULTIPLIER = {
    "Software Engineer" => 1.0, "Senior Software Engineer" => 1.35, "Staff Engineer" => 1.7,
    "Engineering Manager" => 1.8, "QA Engineer" => 0.85,
    "Product Manager" => 1.15, "Senior Product Manager" => 1.45, "Product Designer" => 0.95,
    "Account Executive" => 0.9, "Sales Development Rep" => 0.6, "Sales Manager" => 1.3,
    "Marketing Specialist" => 0.7, "Content Strategist" => 0.7, "Marketing Manager" => 1.1,
    "Financial Analyst" => 0.8, "Accountant" => 0.7, "Finance Manager" => 1.2,
    "HR Generalist" => 0.65, "Recruiter" => 0.7, "People Partner" => 0.95,
    "Operations Analyst" => 0.7, "Support Specialist" => 0.55, "Operations Manager" => 1.0
  }.freeze

  EMPLOYMENT_WEIGHTS = { "full_time" => 90, "contractor" => 6, "part_time" => 4 }.freeze

  FIRST_NAMES = %w[
    Aarav Aisha Alex Amelia Ana Arjun Ben Carlos Chen Chloe Daniel Diego Elena Emma Ethan
    Fatima Felix Hana Hiro Isabela Jack James Julia Kenji Lars Leila Liam Lucas Maria Mateo
    Mei Mia Noah Olivia Omar Priya Rahul Sakura Sara Sofia Tom Wei Yuki Zara Zoe
  ].freeze

  LAST_NAMES = %w[
    Anderson Bauer Brown Chen Costa Das Dubois Fischer Garcia Gupta Hughes Ito Jones Kim
    Kumar Lee Lopez Martin Meyer Moreau Nguyen Patel Petit Reddy Rossi Santos Schmidt Silva
    Singh Smith Suzuki Tanaka Taylor Thompson Wang Watanabe Williams Wilson Wong Yamamoto
  ].freeze

  def initialize(count: 10_000, seed: 42)
    @count = count
    @rng = Random.new(seed)
  end

  def call
    Employee.transaction do
      Employee.delete_all
      (1..@count).each_slice(BATCH_SIZE) do |numbers|
        Employee.insert_all!(numbers.map { |n| build_row(n) })
      end
    end
    @count
  end

  private

  def build_row(number)
    first = FIRST_NAMES[@rng.rand(FIRST_NAMES.size)]
    last = LAST_NAMES[@rng.rand(LAST_NAMES.size)]
    country = weighted_pick(COUNTRY_WEIGHTS)
    department = weighted_pick(DEPARTMENT_WEIGHTS)
    title = OrgCatalog::TITLES_BY_DEPARTMENT.fetch(department).then { |titles| titles[@rng.rand(titles.size)] }
    hire_date = EARLIEST_HIRE + @rng.rand((REFERENCE_DATE - EARLIEST_HIRE).to_i)

    {
      employee_code: format("EMP-%06d", number),
      full_name: "#{first} #{last}",
      email: "#{first}.#{last}.#{number}@acme.example".downcase,
      job_title: title,
      department: department,
      country_code: country,
      employment_type: weighted_pick(EMPLOYMENT_WEIGHTS),
      salary: salary_for(country, title, hire_date),
      hire_date: hire_date
    }
  end

  def salary_for(country, title, hire_date)
    years = (REFERENCE_DATE - hire_date).to_f / 365
    tenure_bump = 1 + [ years, 10 ].min * 0.015 # up to +15% for long tenure
    noise = 0.82 + @rng.rand * 0.36             # +/-18% spread within a role
    raw = COUNTRY_BASE.fetch(country) * TITLE_MULTIPLIER.fetch(title) * tenure_bump * noise
    (raw / 100).round * 100
  end

  def weighted_pick(weights)
    target = @rng.rand(weights.values.sum)
    weights.each do |key, weight|
      return key if target < weight
      target -= weight
    end
  end
end
