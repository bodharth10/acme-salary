require "rails_helper"

RSpec.describe Middleware::SecurityHeaders do
  def call(path, upstream_headers = {})
    app = ->(_env) { [ 200, upstream_headers, [ "ok" ] ] }
    _status, headers, _body = described_class.new(app).call("PATH_INFO" => path)
    headers
  end

  it "adds a restrictive content security policy and anti-framing headers" do
    headers = call("/employees")

    expect(headers["content-security-policy"]).to include("default-src 'self'", "frame-ancestors 'none'", "object-src 'none'")
    expect(headers["x-frame-options"]).to eq("DENY")
    expect(headers["x-content-type-options"]).to eq("nosniff")
  end

  it "forbids caching of API responses, which contain salary data" do
    expect(call("/api/v1/employees")["cache-control"]).to eq("no-store")
  end

  it "leaves caching of static assets alone" do
    expect(call("/assets/app.js", "cache-control" => "public, max-age=31536000")["cache-control"])
      .to eq("public, max-age=31536000")
  end

  it "cannot be weakened by headers set further down the stack" do
    expect(call("/", "x-frame-options" => "ALLOWALL")["x-frame-options"]).to eq("DENY")
  end
end
