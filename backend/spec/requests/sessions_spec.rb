require "rails_helper"

RSpec.describe "Authentication", type: :request do
  def json = JSON.parse(response.body, symbolize_names: true)

  let!(:user) { create(:user, email: "hr@acme.example", name: "Hana") }
  let(:password) { AuthHelpers::TEST_PASSWORD }

  def sign_in(email: user.email, password: self.password)
    post "/api/v1/session", params: { session: { email: email, password: password } }
  end

  describe "POST /api/v1/session" do
    it "signs in with valid credentials and returns the user and a CSRF token" do
      sign_in

      expect(response).to have_http_status(:created)
      expect(json[:user]).to include(name: "Hana", role: "hr_manager", permissions: { manage_employees: true })
      expect(json[:csrf_token]).to be_present
      expect(json[:user]).not_to have_key(:password_digest)
    end

    it "accepts the email in any case" do
      sign_in(email: "  HR@ACME.example ")
      expect(response).to have_http_status(:created)
    end

    it "gives the same answer for a wrong password and an unknown email" do
      sign_in(password: "wrong-password-123")
      wrong_password = [ response.status, json ]

      sign_in(email: "nobody@acme.example")
      unknown_email = [ response.status, json ]

      expect(wrong_password).to eq(unknown_email)
      expect(wrong_password).to eq([ 401, { error: "invalid_credentials", message: "Invalid email or password." } ])
    end

    it "sets an HttpOnly, SameSite=Lax session cookie" do
      sign_in
      cookie = Array(response.headers["set-cookie"]).join("\n")
      expect(cookie).to match(/_acme_salary_session=.*httponly/i).and match(/samesite=lax/i)
    end
  end

  describe "GET /api/v1/session" do
    it "returns no user before sign-in, but still a CSRF token" do
      get "/api/v1/session"

      expect(response).to have_http_status(:ok)
      expect(json[:user]).to be_nil
      expect(json[:csrf_token]).to be_present
    end

    it "returns the signed-in user" do
      sign_in
      get "/api/v1/session"
      expect(json[:user]).to include(email: "hr@acme.example")
    end
  end

  describe "DELETE /api/v1/session" do
    it "signs out, after which the API is closed again" do
      sign_in
      delete "/api/v1/session"
      expect(json[:user]).to be_nil

      get "/api/v1/employees"
      expect(response).to have_http_status(:unauthorized)
    end
  end

  describe "protected endpoints" do
    it "rejects every API endpoint without a session" do
      [ "/api/v1/employees", "/api/v1/employees/1", "/api/v1/meta",
        "/api/v1/insights/overview", "/api/v1/insights/countries/US" ].each do |path|
        get path
        expect(response).to have_http_status(:unauthorized), "expected 401 for #{path}"
        expect(json[:error]).to eq("unauthenticated")
      end
    end

    it "expires the session after 30 idle minutes" do
      sign_in
      get "/api/v1/meta"
      expect(response).to have_http_status(:ok)

      travel 31.minutes do
        get "/api/v1/meta"
        expect(response).to have_http_status(:unauthorized)
      end
    end

    it "keeps an active session alive" do
      sign_in
      travel(20.minutes) { get "/api/v1/meta" }
      travel(40.minutes) { get "/api/v1/meta" }
      expect(response).to have_http_status(:ok)
    end
  end

  describe "CSRF protection" do
    around do |example|
      ApplicationController.allow_forgery_protection = true
      example.run
    ensure
      ApplicationController.allow_forgery_protection = false
    end

    def csrf_token
      get "/api/v1/session"
      json[:csrf_token]
    end

    it "rejects a state-changing request without the token" do
      sign_in
      expect(response).to have_http_status(:forbidden)
      expect(json[:error]).to eq("invalid_csrf_token")
    end

    it "accepts the request when the token is sent in the X-CSRF-Token header" do
      post "/api/v1/session", params: { session: { email: user.email, password: password } },
                              headers: { "X-CSRF-Token" => csrf_token }
      expect(response).to have_http_status(:created)
    end
  end

  describe "login throttling" do
    around do |example|
      Rack::Attack.enabled = true
      Rack::Attack.reset!
      example.run
    ensure
      Rack::Attack.enabled = false
      Rack::Attack.reset!
    end

    it "blocks further attempts after 5 failures in a minute" do
      6.times { sign_in(password: "wrong-password-123") }

      expect(response).to have_http_status(:too_many_requests)
      expect(json[:error]).to eq("rate_limited")
    end
  end
end
