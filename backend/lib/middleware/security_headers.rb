module Middleware
  # Adds security headers to every response, including the static React
  # build (which ActionDispatch::Static serves without Rails' default
  # headers). Kept as plain Rack so it is trivial to test.
  class SecurityHeaders
    # The SPA loads only its own scripts; Mantine needs inline styles.
    CONTENT_SECURITY_POLICY = [
      "default-src 'self'",
      "script-src 'self'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data:",
      "font-src 'self' data:",
      "connect-src 'self'",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "frame-ancestors 'none'"
    ].join("; ").freeze

    HEADERS = {
      "content-security-policy" => CONTENT_SECURITY_POLICY,
      "x-content-type-options" => "nosniff",
      "x-frame-options" => "DENY",
      "referrer-policy" => "strict-origin-when-cross-origin",
      "permissions-policy" => "camera=(), microphone=(), geolocation=(), payment=()",
      "cross-origin-opener-policy" => "same-origin"
    }.freeze

    def initialize(app)
      @app = app
    end

    def call(env)
      status, headers, body = @app.call(env)
      headers = HEADERS.merge(headers) { |_name, ours, _theirs| ours }
      # Salary data must never be stored by browsers or intermediaries.
      headers["cache-control"] = "no-store" if env["PATH_INFO"].to_s.start_with?("/api/")
      [ status, headers, body ]
    end
  end
end
