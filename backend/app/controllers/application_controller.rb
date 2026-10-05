class ApplicationController < ActionController::API
  # API mode leaves these out; cookie sessions need both.
  include ActionController::Cookies
  include ActionController::RequestForgeryProtection

  # Rails applies config.action_controller.* before these modules are mixed
  # in, so honour the setting here (it is switched off only in test.rb).
  self.allow_forgery_protection = Rails.configuration.action_controller.allow_forgery_protection != false

  protect_from_forgery with: :exception
end
