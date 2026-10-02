require "rails_helper"

RSpec.describe PayInsights do
  subject(:insights) { described_class.new }

  before do
    create(:employee, country_code: "US", department: "Engineering", job_title: "Software Engineer", salary: 100_000)
    create(:employee, country_code: "US", department: "Engineering", job_title: "Software Engineer", salary: 120_000)
    create(:employee, country_code: "US", department: "Sales", job_title: "Account Executive", salary: 80_000)
    create(:employee, country_code: "IN", department: "Engineering", job_title: "Software Engineer", salary: 2_000_000)
  end

  describe "#overview" do
    it "reports stats per country in local currency, largest country first" do
      overview = insights.overview

      expect(overview[:headcount]).to eq(4)
      expect(overview[:department_count]).to eq(2)
      expect(overview[:countries].map { |c| c[:code] }).to eq(%w[US IN])

      us = overview[:countries].first
      expect(us).to include(currency: "USD")
      expect(us[:stats]).to include(count: 3, min: 80_000, median: 100_000, max: 120_000)
    end

    it "never mixes currencies: India's numbers are not folded into the US" do
      india = insights.overview[:countries].find { |c| c[:code] == "IN" }
      expect(india[:stats]).to include(count: 1, median: 2_000_000)
      expect(india[:currency]).to eq("INR")
    end

    it "omits countries without employees" do
      expect(insights.overview[:countries].map { |c| c[:code] }).not_to include("JP")
    end
  end

  describe "#country" do
    it "breaks a country down by department and job title, highest median first" do
      us = insights.country("us")

      expect(us[:stats][:count]).to eq(3)
      expect(us[:by_department].map { |d| [ d[:name], d[:stats][:median] ] })
        .to eq([ [ "Engineering", 110_000 ], [ "Sales", 80_000 ] ])
      expect(us[:by_job_title].first).to include(name: "Software Engineer")
      expect(us[:histogram].sum { |b| b[:count] }).to eq(3)
    end

    it "raises not found for an unknown country" do
      expect { insights.country("ZZ") }.to raise_error(ActiveRecord::RecordNotFound)
    end
  end

  describe "#peer_comparison" do
    it "compares an employee to the same title in the same country only" do
      low_paid = Employee.find_by!(salary: 100_000)
      comparison = insights.peer_comparison(low_paid)

      expect(comparison).to include(
        peer_group: "Software Engineer in United States",
        peer_count: 2,
        median: 110_000,
        compa_ratio: 0.91,
        percentile_rank: 0
      )
    end
  end
end
