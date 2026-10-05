module Api
  module V1
    class SessionsController < BaseController
      skip_before_action :authenticate!, only: %i[show create]

      # Who am I? Always 200 so the SPA can also fetch the CSRF token before
      # anyone has signed in.
      def show
        render json: session_payload
      end

      def create
        credentials = params.require(:session).permit(:email, :password)
        # authenticate_by takes the same time whether or not the email
        # exists, so response timing does not reveal valid accounts.
        user = User.authenticate_by(email: credentials[:email].to_s.strip.downcase, password: credentials[:password].to_s)

        if user
          sign_in(user)
          render json: session_payload, status: :created
        else
          # One message for both wrong email and wrong password.
          render json: { error: "invalid_credentials", message: "Invalid email or password." }, status: :unauthorized
        end
      end

      def destroy
        sign_out
        render json: session_payload
      end

      private

      def session_payload
        { user: current_user && UserSerializer.render(current_user), csrf_token: form_authenticity_token }
      end
    end
  end
end
