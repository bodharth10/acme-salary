# Be sure to restart your server when you modify this file.

# Configure parameters to be partially matched (e.g. passw matches password) and filtered from the log file.
# Use this to limit dissemination of sensitive information.
# See the ActiveSupport::ParameterFilter documentation for supported notations and behaviors.
# Salary and names are personal data: keep them out of the logs too.
Rails.application.config.filter_parameters += [
  :passw, :email, :salary, :full_name, :secret, :token, :_key, :crypt, :salt, :certificate, :otp, :ssn
]
