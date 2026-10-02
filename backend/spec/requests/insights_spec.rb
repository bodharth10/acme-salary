require "rails_helper"

RSpec.describe "Insights and meta API", type: :request do
  def json = JSON.parse(response.body, symbolize_names: true)

  before do
    create(:employee, country_code: "GB", salary: 60_000)
    create(:employee, country_code: "GB", salary: 70_000)
  end

  it "GET /api/v1/insights/overview returns per-country stats" do
    get "/api/v1/insights/overview"

    expect(response).to have_http_status(:ok)
    expect(json[:headcount]).to eq(2)
    expect(json[:countries].first).to include(code: "GB", currency: "GBP")
    expect(json[:countries].first[:stats]).to include(median: 65_000)
  end

  it "GET /api/v1/insights/countries/:code returns a country breakdown" do
    get "/api/v1/insights/countries/gb"

    expect(response).to have_http_status(:ok)
    expect(json).to include(:by_department, :by_job_title, :histogram)
  end

  it "GET /api/v1/insights/countries/:code returns 404 for unknown countries" do
    get "/api/v1/insights/countries/zz"
    expect(response).to have_http_status(:not_found)
  end

  it "GET /api/v1/meta returns reference data for forms and filters" do
    get "/api/v1/meta"

    expect(json[:countries]).to include(code: "GB", name: "United Kingdom", currency: "GBP")
    expect(json[:departments]).to include("Engineering")
    expect(json[:employment_types]).to eq(%w[full_time part_time contractor])
  end
end
