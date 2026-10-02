# The organisation's departments and the job titles commonly used in each.
# Departments are a closed list (they drive reporting); job titles are open
# so HR can introduce a new role without a deploy. The title list is used for
# form suggestions and by the seeder.
module OrgCatalog
  TITLES_BY_DEPARTMENT = {
    "Engineering" => [ "Software Engineer", "Senior Software Engineer", "Staff Engineer", "Engineering Manager", "QA Engineer" ],
    "Product"     => [ "Product Manager", "Senior Product Manager", "Product Designer" ],
    "Sales"       => [ "Account Executive", "Sales Development Rep", "Sales Manager" ],
    "Marketing"   => [ "Marketing Specialist", "Content Strategist", "Marketing Manager" ],
    "Finance"     => [ "Financial Analyst", "Accountant", "Finance Manager" ],
    "People"      => [ "HR Generalist", "Recruiter", "People Partner" ],
    "Operations"  => [ "Operations Analyst", "Support Specialist", "Operations Manager" ]
  }.freeze

  DEPARTMENTS = TITLES_BY_DEPARTMENT.keys.freeze
  JOB_TITLES = TITLES_BY_DEPARTMENT.values.flatten.freeze
  EMPLOYMENT_TYPES = %w[full_time part_time contractor].freeze
end
