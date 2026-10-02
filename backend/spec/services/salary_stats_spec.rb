require "rails_helper"

RSpec.describe SalaryStats do
  describe ".summarize" do
    it "returns nils with a zero count for an empty set" do
      expect(described_class.summarize([])).to include(count: 0, min: nil, median: nil)
    end

    it "describes an odd-sized set" do
      expect(described_class.summarize([ 30, 10, 20 ])).to eq(
        count: 3, min: 10, max: 30, mean: 20, median: 20, p25: 15, p75: 25
      )
    end

    it "interpolates the median for an even-sized set" do
      expect(described_class.summarize([ 10, 20, 30, 40 ])[:median]).to eq(25)
    end

    it "shows why median matters: one outlier moves the mean, not the median" do
      stats = described_class.summarize([ 50, 50, 50, 50, 1_000 ])
      expect(stats[:median]).to eq(50)
      expect(stats[:mean]).to eq(240)
    end

    it "ignores nil values" do
      expect(described_class.summarize([ nil, 10, 20 ])[:count]).to eq(2)
    end
  end

  describe ".percentile" do
    it "matches Excel PERCENTILE.INC" do
      sorted = [ 1, 2, 3, 4, 5, 6, 7, 8, 9, 10 ]
      expect(described_class.percentile(sorted, 25)).to eq(3.25)
      expect(described_class.percentile(sorted, 90)).to eq(9.1)
    end
  end

  describe ".percentile_rank" do
    it "returns the share of values strictly below the given value" do
      expect(described_class.percentile_rank([ 10, 20, 30, 40 ], 30)).to eq(50)
      expect(described_class.percentile_rank([ 10, 20, 30, 40 ], 10)).to eq(0)
    end
  end

  describe ".histogram" do
    it "buckets every value exactly once, including the maximum" do
      values = (1..100).to_a
      buckets = described_class.histogram(values, buckets: 4)
      expect(buckets.size).to eq(4)
      expect(buckets.sum { |b| b[:count] }).to eq(100)
      expect(buckets.first[:from]).to eq(1)
      expect(buckets.last[:to]).to eq(100)
    end

    it "returns a single bucket when all values are equal" do
      expect(described_class.histogram([ 5, 5, 5 ])).to eq([ { from: 5, to: 5, count: 3 } ])
    end

    it "returns no buckets for no values" do
      expect(described_class.histogram([])).to eq([])
    end
  end
end
