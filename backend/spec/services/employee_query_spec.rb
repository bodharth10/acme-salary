require "rails_helper"

RSpec.describe EmployeeQuery do
  let!(:alice) { create(:employee, full_name: "Alice", country_code: "US", department: "Engineering", salary: 150_000) }
  let!(:bob)   { create(:employee, full_name: "Bob", country_code: "IN", department: "Sales", job_title: "Account Executive", salary: 1_500_000) }
  let!(:cara)  { create(:employee, full_name: "Cara", country_code: "US", department: "Sales", job_title: "Account Executive", salary: 90_000) }

  def names(params) = described_class.new(params).call.records.map(&:full_name)

  it "returns everyone sorted by name by default" do
    expect(names({})).to eq(%w[Alice Bob Cara])
  end

  it "filters by country, department and job title together" do
    expect(names(country: "us", department: "Sales")).to eq(%w[Cara])
    expect(names(job_title: "Account Executive")).to eq(%w[Bob Cara])
  end

  it "searches by name" do
    expect(names(q: "bo")).to eq(%w[Bob])
  end

  it "sorts by a whitelisted column and direction" do
    expect(names(sort: "salary", direction: "desc")).to eq(%w[Bob Alice Cara])
  end

  it "ignores sort columns that are not whitelisted" do
    expect(names(sort: "email; DROP TABLE employees")).to eq(%w[Alice Bob Cara])
  end

  it "paginates and reports totals" do
    result = described_class.new(per_page: 2, page: 2).call
    expect(result.records.map(&:full_name)).to eq(%w[Cara])
    expect(result.total).to eq(3)
    expect(result.total_pages).to eq(2)
  end

  it "clamps page and per_page to sane bounds" do
    result = described_class.new(page: -3, per_page: 10_000).call
    expect(result.page).to eq(1)
    expect(result.per_page).to eq(EmployeeQuery::MAX_PER_PAGE)
  end
end
