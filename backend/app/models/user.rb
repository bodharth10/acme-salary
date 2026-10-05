# Someone who can sign in. Authorization is role based and intentionally
# small: HR managers can change salary data, viewers can only read it.
class User < ApplicationRecord
  ROLES = %w[hr_manager viewer].freeze
  MIN_PASSWORD_LENGTH = 12

  has_secure_password

  normalizes :email, with: ->(email) { email.strip.downcase }

  validates :name, presence: true, length: { maximum: 120 }
  validates :email, presence: true, uniqueness: true, format: { with: URI::MailTo::EMAIL_REGEXP }
  validates :role, inclusion: { in: ROLES }
  validates :password, length: { minimum: MIN_PASSWORD_LENGTH }, allow_nil: true

  def hr_manager? = role == "hr_manager"

  # The single authorization rule in the system, kept on the model so
  # controllers and serializers ask the same question.
  def can_manage_employees? = hr_manager?
end
