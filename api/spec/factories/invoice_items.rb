FactoryBot.define do
  factory :invoice_item do
    invoice
    item_type { "product" }
    sequence(:name) { |n| "テスト項目#{n}" }
    quantity { 1 }
    unit { "個" }
    unit_price { 10000 }
    amount { 10000 }
    sequence(:sort_order) { |n| n }

    trait :header do
      item_type { "header" }
      name { "作業分" }
      quantity { nil }
      unit { nil }
      unit_price { nil }
      amount { nil }
    end

    trait :product do
      item_type { "product" }
      name { "製品A" }
      quantity { 1 }
      unit { "個" }
      unit_price { 10000 }
      amount { 10000 }
    end

    trait :material do
      item_type { "material" }
      name { "資材X" }
      quantity { 2 }
      unit { "m" }
      unit_price { 500 }
      amount { 1000 }
    end

    trait :labor do
      item_type { "labor" }
      name { "作業工賃" }
      quantity { 8 }
      unit { "時間" }
      unit_price { 3000 }
      amount { 24000 }
    end

    trait :other do
      item_type { "other" }
      name { "諸経費" }
      quantity { 1 }
      unit { "式" }
      unit_price { 5000 }
      amount { 5000 }
    end

    trait :with_source_product do
      transient do
        source { nil }
      end

      after(:build) do |item, evaluator|
        product = evaluator.source || create(:product, tenant: item.invoice.tenant)
        item.source_product_id = product.id
        item.name = product.name
        item.unit = product.unit
        item.unit_price = product.unit_price
        item.amount = item.quantity * item.unit_price
      end
    end

    trait :with_source_material do
      transient do
        source { nil }
      end

      after(:build) do |item, evaluator|
        material = evaluator.source || create(:material, tenant: item.invoice.tenant)
        item.source_material_id = material.id
        item.name = material.name
        item.unit = material.unit
        item.unit_price = material.unit_price
        item.amount = item.quantity * item.unit_price
      end
    end
  end
end
