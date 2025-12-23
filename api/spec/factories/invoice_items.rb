# == Schema Information
#
# Table name: invoice_items
#
#  id                                                           :uuid             not null, primary key
#  amount(金額（数量×単価、headerの場合はNULL）)                :decimal(12, )
#  item_type(項目タイプ（header/product/material/labor/other）) :string           not null
#  name(名称（コピー値、手動編集可）)                           :string           not null
#  note(備考)                                                   :text
#  quantity(数量（headerの場合はNULL）)                         :decimal(10, 2)
#  sort_order(表示順)                                           :integer          default(0), not null
#  unit(単位（式、個、m、時間等）)                              :string
#  unit_price(単価（コピー値、headerの場合はNULL）)             :decimal(12, )
#  created_at                                                   :datetime         not null
#  updated_at                                                   :datetime         not null
#  invoice_id(請求書ID)                                         :uuid             not null
#
# Indexes
#
#  index_invoice_items_on_invoice_id                 (invoice_id)
#  index_invoice_items_on_invoice_id_and_sort_order  (invoice_id,sort_order)
#  index_invoice_items_on_item_type                  (item_type)
#
# Foreign Keys
#
#  fk_rails_...  (invoice_id => invoices.id) ON DELETE => cascade
#
FactoryBot.define do
  factory :invoice_item do
    invoice
    item_type { "other" }
    sequence(:name) { |n| "テスト項目#{n}" }
    quantity { 1 }
    unit_price { 1000 }
    amount { 1000 }
    unit { "個" }
    sort_order { 0 }

    trait :header do
      item_type { "header" }
      quantity { nil }
      unit_price { nil }
      unit { nil }
    end

    trait :product do
      item_type { "product" }
    end

    trait :material do
      item_type { "material" }
    end

    trait :labor do
      item_type { "labor" }
      name { "人件費" }
      unit { "時間" }
    end

    trait :integrated do
      item_type { "integrated" }
      name { "工事一式" }
      quantity { 1 }
      unit { "式" }
      unit_price { nil }
    end
  end
end
