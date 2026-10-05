# Basic abuse protection. Limits are generous for a human using the UI and
# tight enough to stop scraping the whole salary table or hammering writes.
# Counters are per-process memory, which is right for a single instance; use
# a shared store (Redis) when running more than one.
class Rack::Attack
  Rack::Attack.cache.store = ActiveSupport::Cache::MemoryStore.new

  READ_LIMIT = 300  # requests per minute per IP
  WRITE_LIMIT = 60

  throttle("api/ip", limit: ->(_request) { READ_LIMIT }, period: 1.minute) do |request|
    request.ip if request.path.start_with?("/api/")
  end

  throttle("api/writes/ip", limit: ->(_request) { WRITE_LIMIT }, period: 1.minute) do |request|
    request.ip if request.path.start_with?("/api/") && !request.get? && !request.head?
  end

  # Slow down password guessing: by source IP and by targeted account.
  LOGIN_LIMIT = 5 # attempts per minute
  LOGIN_PATH = "/api/v1/session".freeze

  throttle("logins/ip", limit: ->(_request) { LOGIN_LIMIT }, period: 1.minute) do |request|
    request.ip if request.post? && request.path == LOGIN_PATH
  end

  throttle("logins/email", limit: ->(_request) { LOGIN_LIMIT }, period: 1.minute) do |request|
    login_email(request) if request.post? && request.path == LOGIN_PATH
  end

  # The SPA posts JSON, which Rack does not parse into request.params.
  def self.login_email(request)
    body = request.body.read
    request.body.rewind
    JSON.parse(body).dig("session", "email").to_s.strip.downcase.presence
  rescue JSON::ParserError, TypeError
    nil
  end

  self.throttled_responder = lambda do |request|
    retry_after = (request.env["rack.attack.match_data"] || {})[:period]
    body = { error: "rate_limited", message: "Too many requests. Please retry shortly." }.to_json
    [ 429, { "content-type" => "application/json", "retry-after" => retry_after.to_s }, [ body ] ]
  end
end

# Specs opt in explicitly so unrelated tests can never trip a limit.
Rack::Attack.enabled = !Rails.env.test?
