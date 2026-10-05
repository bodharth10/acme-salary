require "rails_helper"

RSpec.describe "API hardening", type: :request do
  def json = JSON.parse(response.body, symbolize_names: true)

  it "sends security headers and forbids caching on API responses" do
    get "/api/v1/meta"

    expect(response.headers["content-security-policy"]).to include("default-src 'self'")
    expect(response.headers["x-frame-options"]).to eq("DENY")
    expect(response.headers["cache-control"]).to eq("no-store")
  end

  it "returns a JSON 404 for unknown API paths" do
    get "/api/v1/payroll/export"

    expect(response).to have_http_status(:not_found)
    expect(json).to eq(error: "not_found", message: "No such endpoint")
  end

  it "does not leak the SQL or a stack trace when a record is missing" do
    get "/api/v1/employees/999999"
    expect(response.body).not_to match(/SELECT|backtrace|\.rb:/)
  end

  it "ignores over-long search terms instead of running them" do
    create(:employee, full_name: "Jane Doe")
    get "/api/v1/employees", params: { q: "jane" + ("x" * 5_000) }
    expect(response).to have_http_status(:ok)
  end

  it "enforces a positive salary in the database, not only in the model" do
    employee = create(:employee)
    expect { employee.update_column(:salary, -1) }.to raise_error(ActiveRecord::StatementInvalid, /salary_positive|CHECK/i)
  end

  describe "rate limiting" do
    around do |example|
      Rack::Attack.enabled = true
      Rack::Attack.reset!
      example.run
    ensure
      Rack::Attack.enabled = false
      Rack::Attack.reset!
    end

    it "returns 429 once an IP exceeds the write limit" do
      stub_const("Rack::Attack::WRITE_LIMIT", 2)

      3.times { post "/api/v1/employees", params: { employee: { full_name: "" } } }

      expect(response).to have_http_status(:too_many_requests)
      expect(json[:error]).to eq("rate_limited")
      expect(response.headers["retry-after"]).to eq("60")
    end
  end
end
