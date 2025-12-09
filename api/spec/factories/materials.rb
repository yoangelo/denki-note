FactoryBot.define do
  factory :material do
    tenant
    sequence(:name) { |n| "テスト資材#{n}" }
    sequence(:model_number) { |n| "MAT-#{format("%04d", n)}" }
    unit { "m" }
    unit_price { 500 }
    material_type { "電線" }

    trait :discarded do
      discarded_at { Time.current }
    end
  end
end
