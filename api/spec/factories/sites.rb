FactoryBot.define do
  factory :site do
    tenant
    customer
    sequence(:name) { |n| "テスト現場#{n}" }
    note { nil }

    trait :discarded do
      discarded_at { Time.current }
    end
  end
end
