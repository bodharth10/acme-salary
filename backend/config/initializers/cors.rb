# Only needed when the UI is hosted on a different origin from the API.
# In development Vite proxies /api, and in production Rails serves the UI.
if (origins = ENV["CORS_ORIGINS"]).present?
  Rails.application.config.middleware.insert_before 0, Rack::Cors do
    allow do
      origins(*origins.split(","))
      resource "/api/*", headers: :any, methods: %i[get post patch put delete options]
    end
  end
end
