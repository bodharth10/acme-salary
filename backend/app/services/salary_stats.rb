# Pure functions for describing a set of salaries. No database access, so
# the maths is trivially unit-testable and reusable for any grouping.
module SalaryStats
  module_function

  def summarize(values)
    sorted = values.compact.sort
    return { count: 0, min: nil, max: nil, mean: nil, median: nil, p25: nil, p75: nil } if sorted.empty?

    {
      count: sorted.size,
      min: sorted.first,
      max: sorted.last,
      mean: (sorted.sum.to_f / sorted.size).round,
      median: percentile(sorted, 50).round,
      p25: percentile(sorted, 25).round,
      p75: percentile(sorted, 75).round
    }
  end

  # Linear interpolation between closest ranks (same method as Excel's
  # PERCENTILE.INC), so numbers match what HR used to compute by hand.
  def percentile(sorted, pct)
    return nil if sorted.empty?

    rank = (pct / 100.0) * (sorted.size - 1)
    lower = sorted[rank.floor]
    upper = sorted[rank.ceil]
    lower + (upper - lower) * (rank - rank.floor)
  end

  # Share of values strictly below `value`, 0..100.
  def percentile_rank(sorted, value)
    return nil if sorted.empty?

    ((sorted.count { |v| v < value }.to_f / sorted.size) * 100).round
  end

  def histogram(values, buckets: 10)
    return [] if values.empty?

    min, max = values.minmax
    return [ { from: min, to: max, count: values.size } ] if min == max

    width = ((max - min).to_f / buckets).ceil
    counts = Array.new(buckets, 0)
    values.each { |v| counts[[ (v - min) / width, buckets - 1 ].min] += 1 }
    counts.each_with_index.map do |count, i|
      from = min + i * width
      { from: from, to: i == buckets - 1 ? max : from + width, count: count }
    end
  end
end
