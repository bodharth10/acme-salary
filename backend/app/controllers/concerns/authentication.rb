# Cookie-session authentication for the API.
#
# - The session cookie is HttpOnly, SameSite=Lax and Secure in production,
#   so scripts cannot read it and other sites cannot send it on writes.
# - Sessions expire after IDLE_TIMEOUT without activity.
# - Every non-GET request must also carry the CSRF token (see
#   ApplicationController), which the SPA reads from GET /api/v1/session.
module Authentication
  extend ActiveSupport::Concern

  IDLE_TIMEOUT = 30.minutes

  included do
    before_action :authenticate!
  end

  private

  def current_user
    return @current_user if defined?(@current_user)

    @current_user = session_expired? ? nil : User.find_by(id: session[:user_id])
  end

  def authenticate!
    if current_user
      session[:last_seen_at] = Time.current.to_i
    else
      reset_session
      render json: { error: "unauthenticated", message: "Please sign in." }, status: :unauthorized
    end
  end

  def require_employee_management!
    return if current_user.can_manage_employees?

    render json: { error: "forbidden", message: "Your role cannot change salary data." }, status: :forbidden
  end

  def sign_in(user)
    reset_session # new session id on login: prevents session fixation
    session[:user_id] = user.id
    session[:last_seen_at] = Time.current.to_i
    @current_user = user
  end

  def sign_out
    reset_session
    @current_user = nil
  end

  def session_expired?
    last_seen = session[:last_seen_at]
    last_seen.blank? || Time.zone.at(last_seen) < IDLE_TIMEOUT.ago
  end
end
