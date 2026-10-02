# Answers "how does ACME pay people?". Salaries are only ever compared within
# a single country, because each country pays in its own currency and we
# deliberately do not do FX conversion (see docs/DECISIONS.md).
#
# Medians and percentiles are computed in Ruby: SQLite has no percentile
# function, and plucking 10k integers is a few milliseconds.
class PayInsights
  def overview
    rows = Employee.pluck(:country_code, :salary).group_by(&:first)

    countries = Country.all.filter_map do |country|
      salaries = rows.fetch(country.code, []).map(&:last)
      next if salaries.empty?

      country_payload(country).merge(stats: SalaryStats.summarize(salaries))
    end

    {
      headcount: countries.sum { |c| c[:stats][:count] },
      department_count: Employee.distinct.count(:department),
      countries: countries.sort_by { |c| -c[:stats][:count] }
    }
  end

  def country(code)
    country = Country.find(code)
    rows = Employee.in_country(country.code).pluck(:department, :job_title, :salary)
    salaries = rows.map(&:last)

    country_payload(country).merge(
      stats: SalaryStats.summarize(salaries),
      histogram: SalaryStats.histogram(salaries),
      by_department: grouped_stats(rows) { |department, _title, _salary| department },
      by_job_title: grouped_stats(rows) { |_department, title, _salary| title }
    )
  end

  # Where an employee sits relative to peers with the same title in the same
  # country. compa_ratio = salary / peer median (1.0 = exactly at the median).
  def peer_comparison(employee)
    peers = Employee.where(country_code: employee.country_code, job_title: employee.job_title)
                    .pluck(:salary).sort
    stats = SalaryStats.summarize(peers)

    {
      peer_group: "#{employee.job_title} in #{employee.country&.name}",
      peer_count: stats[:count],
      median: stats[:median],
      p25: stats[:p25],
      p75: stats[:p75],
      compa_ratio: stats[:median]&.positive? ? (employee.salary.to_f / stats[:median]).round(2) : nil,
      percentile_rank: SalaryStats.percentile_rank(peers, employee.salary)
    }
  end

  private

  def country_payload(country)
    { code: country.code, name: country.name, currency: country.currency }
  end

  def grouped_stats(rows, &key)
    rows.group_by(&key)
        .map { |name, group| { name: name, stats: SalaryStats.summarize(group.map(&:last)) } }
        .sort_by { |g| -g[:stats][:median] }
  end
end
