FactoryBot.define do
  factory :tenant_setting do
    tenant
    default_unit_rate { 3000 }
    money_rounding { "round" }
  end
end
