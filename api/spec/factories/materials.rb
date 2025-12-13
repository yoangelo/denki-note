# == Schema Information
#
# Table name: materials
#
#  id                                    :uuid             not null, primary key
#  discarded_at(削除日時（論理削除）)    :datetime
#  material_type(資材タイプ（自由入力）) :string
#  model_number(型番)                    :string
#  name(名称)                            :string           not null
#  unit(単位)                            :string
#  unit_price(単価)                      :decimal(12, )    default(0), not null
#  created_at                            :datetime         not null
#  updated_at                            :datetime         not null
#  tenant_id(自社ID)                     :uuid             not null
#
# Indexes
#
#  index_materials_on_discarded_at        (discarded_at)
#  index_materials_on_model_number        (model_number)
#  index_materials_on_tenant_id           (tenant_id)
#  index_materials_on_tenant_id_and_name  (tenant_id,name)
#
# Foreign Keys
#
#  fk_rails_...  (tenant_id => tenants.id)
#
FactoryBot.define do
  factory :material do
    tenant
    sequence(:name) { |n| "テスト資材#{n}" }
    unit_price { 500 }
    unit { "個" }

    trait :discarded do
      discarded_at { Time.current }
    end
  end
end
