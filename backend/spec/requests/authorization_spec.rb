require "rails_helper"

RSpec.describe "Authorization", type: :request do
  def json = JSON.parse(response.body, symbolize_names: true)

  let!(:employee) { create(:employee, salary: 100_000) }
  let(:attributes) do
    { full_name: "New Hire", email: "new@acme.example", job_title: "Recruiter", department: "People",
      country_code: "GB", employment_type: "full_time", salary: 50_000, hire_date: "2024-01-01" }
  end

  context "as a read-only viewer" do
    before { sign_in_as(create(:user, :viewer)) }

    it "can read employees and insights" do
      get "/api/v1/employees"
      expect(response).to have_http_status(:ok)

      get "/api/v1/employees/#{employee.id}"
      expect(response).to have_http_status(:ok)

      get "/api/v1/insights/overview"
      expect(response).to have_http_status(:ok)
    end

    it "cannot create an employee" do
      expect { post "/api/v1/employees", params: { employee: attributes } }.not_to change(Employee, :count)
      expect(response).to have_http_status(:forbidden)
      expect(json[:error]).to eq("forbidden")
    end

    it "cannot change a salary" do
      patch "/api/v1/employees/#{employee.id}", params: { employee: { salary: 999_999 } }

      expect(response).to have_http_status(:forbidden)
      expect(employee.reload.salary).to eq(100_000)
    end

    it "cannot delete an employee" do
      expect { delete "/api/v1/employees/#{employee.id}" }.not_to change(Employee, :count)
      expect(response).to have_http_status(:forbidden)
    end

    it "is told what it may do, so the UI can hide the controls" do
      get "/api/v1/session"
      expect(json[:user][:permissions]).to eq(manage_employees: false)
    end
  end

  context "as an HR manager" do
    before { sign_in_as(create(:user)) }

    it "can create, update and delete" do
      post "/api/v1/employees", params: { employee: attributes }
      expect(response).to have_http_status(:created)

      patch "/api/v1/employees/#{employee.id}", params: { employee: { salary: 120_000 } }
      expect(response).to have_http_status(:ok)

      delete "/api/v1/employees/#{employee.id}"
      expect(response).to have_http_status(:no_content)
    end
  end
end
