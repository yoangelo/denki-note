FactoryBot.define do
  factory :daily_report_product do
    daily_report
    product
    quantity { 1 }

    after(:build) do |drp|
      drp.product ||= build(:product, tenant: drp.daily_report.tenant)
    end
  end
end
