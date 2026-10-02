# Seeds 10,000 deterministic employees. Safe to run repeatedly: it does
# nothing if data already exists, unless RESEED=1 is set.
#
#   bin/rails db:seed
#   RESEED=1 bin/rails db:seed
#   SEED_COUNT=500 RESEED=1 bin/rails db:seed

if Employee.exists? && ENV["RESEED"].blank?
  puts "Employees already present (#{Employee.count}); set RESEED=1 to regenerate."
else
  count = Integer(ENV.fetch("SEED_COUNT", 10_000))
  started = Process.clock_gettime(Process::CLOCK_MONOTONIC)
  EmployeeSeeder.new(count: count).call
  elapsed = Process.clock_gettime(Process::CLOCK_MONOTONIC) - started
  puts format("Seeded %d employees in %.2fs", count, elapsed)
end
