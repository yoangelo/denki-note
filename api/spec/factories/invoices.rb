FactoryBot.define do
  factory :invoice do
    tenant
    customer
    site { nil }
    association :creator, factory: :user
    title { "テスト請求書" }
    customer_name { "テスト顧客" }
    site_name { nil }
    subtotal { 10000 }
    tax_rate { 10.0 }
    tax_amount { 1000 }
    total_amount { 11000 }
    status { "draft" }

    after(:build) do |invoice|
      invoice.customer_name ||= invoice.customer&.name
      invoice.site_name ||= invoice.site&.name
      invoice.creator ||= build(:user, tenant: invoice.tenant)
    end

    trait :with_site do
      site
      after(:build) do |invoice|
        invoice.site_name = invoice.site&.name
      end
    end

    trait :draft do
      status { "draft" }
      invoice_number { nil }
      issued_at { nil }
    end

    trait :issued do
      status { "issued" }
      sequence(:invoice_number) { |n| "INV-#{Time.current.year}-#{format("%03d", n)}" }
      issued_at { Time.current }
    end

    trait :canceled do
      status { "canceled" }
      sequence(:invoice_number) { |n| "INV-#{Time.current.year}-#{format("%03d", n)}" }
      issued_at { 1.day.ago }
      discarded_at { Time.current }
    end

    trait :with_items do
      transient do
        items_count { 3 }
      end

      after(:create) do |invoice, evaluator|
        create_list(:invoice_item, evaluator.items_count, invoice: invoice)
      end
    end
  end
end
