FactoryBot.define do
  factory :customer do
    tenant
    sequence(:name) { |n| "テスト顧客#{n}" }
    customer_type { 'corporate' }
    rate_percent { 100 }

    trait :individual do
      customer_type { 'individual' }
    end

    trait :corporate do
      customer_type { 'corporate' }
      sequence(:corporation_number) { |n| format('%013d', n) }
    end

    trait :discarded do
      discarded_at { Time.current }
    end
  end
end
