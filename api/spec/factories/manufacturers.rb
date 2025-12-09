FactoryBot.define do
  factory :manufacturer do
    sequence(:name) { |n| "テストメーカー#{n}" }

    trait :discarded do
      discarded_at { Time.current }
    end
  end
end
