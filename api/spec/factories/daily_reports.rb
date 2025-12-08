FactoryBot.define do
  factory :daily_report do
    tenant
    site
    work_date { Date.current }
    summary { 'テスト作業概要' }

    transient do
      entries_count { 1 }
      work_user { nil }
    end

    after(:build) do |daily_report, evaluator|
      if daily_report.work_entries.empty?
        user = evaluator.work_user || build(:user, tenant: daily_report.tenant)
        evaluator.entries_count.times do
          daily_report.work_entries << build(:work_entry, daily_report: daily_report, tenant: daily_report.tenant, user: user)
        end
      end
    end

    trait :discarded do
      discarded_at { Time.current }
    end
  end
end
