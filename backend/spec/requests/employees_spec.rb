require "rails_helper"

RSpec.describe "Employees API", type: :request do
  def json = JSON.parse(response.body, symbolize_names: true)

  before { sign_in_as(create(:user)) }

  let(:valid_attributes) do
    { full_name: "Priya Patel", email: "priya@acme.example", job_title: "Product Manager",
      department: "Product", country_code: "IN", employment_type: "full_time",
      salary: 2_400_000, hire_date: "2022-04-01" }
  end

  describe "GET /api/v1/employees" do
    it "returns a page of employees with pagination meta" do
      create_list(:employee, 3)
      get "/api/v1/employees", params: { per_page: 2 }

      expect(response).to have_http_status(:ok)
      expect(json[:data].size).to eq(2)
      expect(json[:meta]).to eq(total: 3, page: 1, per_page: 2, total_pages: 2)
      expect(json[:data].first.keys).to include(:employee_code, :salary, :currency)
    end

    it "applies filters" do
      create(:employee, country_code: "DE", full_name: "Lars Meyer")
      create(:employee, country_code: "US")
      get "/api/v1/employees", params: { country: "DE" }

      expect(json[:data].map { |e| e[:full_name] }).to eq([ "Lars Meyer" ])
      expect(json[:data].first[:currency]).to eq("EUR")
    end
  end

  describe "GET /api/v1/employees/:id" do
    it "includes the peer comparison" do
      employee = create(:employee)
      get "/api/v1/employees/#{employee.id}"

      expect(response).to have_http_status(:ok)
      expect(json[:peer_comparison]).to include(peer_count: 1, compa_ratio: 1.0)
    end

    it "returns 404 for a missing employee" do
      get "/api/v1/employees/0"
      expect(response).to have_http_status(:not_found)
      expect(json[:error]).to eq("not_found")
    end
  end

  describe "POST /api/v1/employees" do
    it "creates an employee" do
      expect { post "/api/v1/employees", params: { employee: valid_attributes } }
        .to change(Employee, :count).by(1)

      expect(response).to have_http_status(:created)
      expect(json).to include(full_name: "Priya Patel", currency: "INR")
    end

    it "returns field-level errors for invalid input" do
      post "/api/v1/employees", params: { employee: valid_attributes.merge(salary: -1, email: "nope") }

      expect(response).to have_http_status(:unprocessable_content)
      expect(json[:errors].keys).to contain_exactly(:salary, :email)
    end

    it "does not let clients set the employee code" do
      post "/api/v1/employees", params: { employee: valid_attributes.merge(employee_code: "HACKED") }
      expect(json[:employee_code]).not_to eq("HACKED")
    end

    it "returns 400 when the employee payload is missing" do
      post "/api/v1/employees", params: {}
      expect(response).to have_http_status(:bad_request)
    end
  end

  describe "PATCH /api/v1/employees/:id" do
    it "updates the salary" do
      employee = create(:employee, salary: 100_000)
      patch "/api/v1/employees/#{employee.id}", params: { employee: { salary: 110_000 } }

      expect(response).to have_http_status(:ok)
      expect(employee.reload.salary).to eq(110_000)
    end

    it "rejects invalid updates without saving" do
      employee = create(:employee, salary: 100_000)
      patch "/api/v1/employees/#{employee.id}", params: { employee: { salary: 0 } }

      expect(response).to have_http_status(:unprocessable_content)
      expect(employee.reload.salary).to eq(100_000)
    end
  end

  describe "DELETE /api/v1/employees/:id" do
    it "deletes the employee" do
      employee = create(:employee)
      expect { delete "/api/v1/employees/#{employee.id}" }.to change(Employee, :count).by(-1)
      expect(response).to have_http_status(:no_content)
    end
  end
end
