module AuthHelpers
  TEST_PASSWORD = "correct-horse-battery".freeze

  # Signs in through the real endpoint so request specs exercise the same
  # cookie session the browser uses.
  def sign_in_as(user)
    post "/api/v1/session", params: { session: { email: user.email, password: TEST_PASSWORD } }
    expect(response).to have_http_status(:created)
  end
end

RSpec.configure do |config|
  config.include AuthHelpers, type: :request
  config.include ActiveSupport::Testing::TimeHelpers
end
