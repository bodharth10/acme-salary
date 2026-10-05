module Api
  class BaseController < ApplicationController
    include Authentication

    rescue_from ActiveRecord::RecordNotFound do |error|
      render json: { error: "not_found", message: error.message }, status: :not_found
    end

    rescue_from ActiveRecord::RecordInvalid do |error|
      render_validation_errors(error.record)
    end

    rescue_from ActionController::ParameterMissing do |error|
      render json: { error: "bad_request", message: error.message }, status: :bad_request
    end

    rescue_from ActionController::InvalidAuthenticityToken do
      render json: { error: "invalid_csrf_token", message: "Your session is out of date. Reload and try again." },
             status: :forbidden
    end

    # Unknown /api paths get the same JSON error shape as everything else.
    def route_not_found
      render json: { error: "not_found", message: "No such endpoint" }, status: :not_found
    end

    private

    def render_validation_errors(record)
      render json: { error: "validation_failed", errors: record.errors.to_hash(true) },
             status: :unprocessable_content
    end
  end
end
