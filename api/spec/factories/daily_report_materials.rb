FactoryBot.define do
  factory :daily_report_material do
    daily_report
    material
    quantity { 1 }

    after(:build) do |drm|
      drm.material ||= build(:material, tenant: drm.daily_report.tenant)
    end
  end
end
