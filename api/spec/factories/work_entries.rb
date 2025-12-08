FactoryBot.define do
  factory :work_entry do
    tenant
    daily_report
    user
    minutes { 60 }
    summary { nil }
  end
end
