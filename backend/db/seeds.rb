# Seeds demo logins and 10,000 deterministic employees. Safe to run
# repeatedly: existing data is left alone unless RESEED=1 is set.
#
#   bin/rails db:seed
#   RESEED=1 bin/rails db:seed
#   SEED_COUNT=500 RESEED=1 bin/rails db:seed

# Demo accounts, documented in the README so reviewers can sign in. The
# passwords are public by design: override them with HR_PASSWORD and
# VIEWER_PASSWORD (or delete these users) on any deployment with real data.
DEMO_USERS = [
  { name: "Hana Meyer (HR Manager)", email: "hr@acme.example", role: "hr_manager",
    password: ENV.fetch("HR_PASSWORD", "acme-hr-demo-2026") },
  { name: "Omar Singh (Read-only)", email: "viewer@acme.example", role: "viewer",
    password: ENV.fetch("VIEWER_PASSWORD", "acme-viewer-demo-2026") }
].freeze

DEMO_USERS.each do |attributes|
  user = User.find_or_initialize_by(email: attributes[:email])
  user.update!(attributes)
end
puts "Demo users ready: #{DEMO_USERS.map { |u| u[:email] }.join(', ')}"

if Employee.exists? && ENV["RESEED"].blank?
  puts "Employees already present (#{Employee.count}); set RESEED=1 to regenerate."
else
  count = Integer(ENV.fetch("SEED_COUNT", 10_000))
  started = Process.clock_gettime(Process::CLOCK_MONOTONIC)
  EmployeeSeeder.new(count: count).call
  elapsed = Process.clock_gettime(Process::CLOCK_MONOTONIC) - started
  puts format("Seeded %d employees in %.2fs", count, elapsed)
end
