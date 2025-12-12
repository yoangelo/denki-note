# == Schema Information
#
# Table name: tenant_settings
#
#  id(ID)                                         :uuid             not null, primary key
#  default_unit_rate(既定単価（円/時）)           :integer          default(3000)
#  money_rounding(丸めルール（round/ceil/floor）) :string           default("round")
#  created_at(作成日時)                           :datetime         not null
#  updated_at(更新日時)                           :datetime         not null
#  tenant_id(自社ID)                              :uuid             not null
#
# Indexes
#
#  index_tenant_settings_on_tenant_id  (tenant_id)
#
# Foreign Keys
#
#  fk_rails_...  (tenant_id => tenants.id)
#
FactoryBot.define do
  factory :tenant_setting do
    tenant
    default_unit_rate { 3000 }
    money_rounding { "round" }
  end
end
