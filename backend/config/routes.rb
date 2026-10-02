Rails.application.routes.draw do
  get "up" => "rails/health#show", as: :rails_health_check

  namespace :api do
    namespace :v1 do
      resources :employees, only: %i[index show create update destroy]
      get "meta", to: "meta#show"
      get "insights/overview", to: "insights#overview"
      get "insights/countries/:code", to: "insights#country", as: :country_insights
    end
  end

  get "*path", to: "spa#index", constraints: ->(req) { !req.path.start_with?("/api") }
  root "spa#index"
end
