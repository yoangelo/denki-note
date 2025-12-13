# == Schema Information
#
# Table name: products
#
#  id                                 :uuid             not null, primary key
#  discarded_at(削除日時（論理削除）) :datetime
#  model_number(型番)                 :string
#  name(名称)                         :string           not null
#  unit(単位)                         :string
#  unit_price(単価)                   :decimal(12, )    default(0), not null
#  created_at                         :datetime         not null
#  updated_at                         :datetime         not null
#  manufacturer_id(メーカーID)        :uuid
#  tenant_id(自社ID)                  :uuid             not null
#
# Indexes
#
#  index_products_on_discarded_at        (discarded_at)
#  index_products_on_manufacturer_id     (manufacturer_id)
#  index_products_on_model_number        (model_number)
#  index_products_on_tenant_id           (tenant_id)
#  index_products_on_tenant_id_and_name  (tenant_id,name)
#
# Foreign Keys
#
#  fk_rails_...  (manufacturer_id => manufacturers.id)
#  fk_rails_...  (tenant_id => tenants.id)
#
FactoryBot.define do
  factory :product do
    tenant
    sequence(:name) { |n| "テスト製品#{n}" }
    unit_price { 1000 }
    unit { "個" }

    trait :with_manufacturer do
      manufacturer
    end

    trait :discarded do
      discarded_at { Time.current }
    end
  end
end
