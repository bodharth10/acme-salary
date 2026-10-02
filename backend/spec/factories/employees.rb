FactoryBot.define do
  factory :employee do
    sequence(:full_name) { |n| "Employee #{n}" }
    sequence(:email) { |n| "employee#{n}@acme.example" }
    job_title { "Software Engineer" }
    department { "Engineering" }
    country_code { "US" }
    employment_type { "full_time" }
    salary { 100_000 }
    hire_date { Date.new(2020, 1, 15) }
  end
end
