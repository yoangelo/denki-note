FactoryBot.define do
  factory :product do
    tenant
    manufacturer
    sequence(:name) { |n| "テスト製品#{n}" }
    sequence(:model_number) { |n| "MODEL-#{format("%04d", n)}" }
    unit { "個" }
    unit_price { 10000 }

    trait :without_manufacturer do
      manufacturer { nil }
    end

    trait :discarded do
      discarded_at { Time.current }
    end
  end
end
