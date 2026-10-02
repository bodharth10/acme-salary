module Api
  module V1
    class InsightsController < BaseController
      def overview
        render json: PayInsights.new.overview
      end

      def country
        render json: PayInsights.new.country(params[:code])
      end
    end
  end
end
