FactoryBot.define do
  factory :user do
    sequence(:name) { |n| "User #{n}" }
    sequence(:email) { |n| "user#{n}@acme.example" }
    password { AuthHelpers::TEST_PASSWORD }
    role { "hr_manager" }

    trait :viewer do
      role { "viewer" }
    end
  end
end
