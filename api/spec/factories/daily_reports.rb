# == Schema Information
#
# Table name: daily_reports
#
#  id(ID)                             :uuid             not null, primary key
#  created_by(作成者ID)               :uuid
#  discarded_at(削除日時（論理削除）) :datetime
#  labor_cost                         :decimal(12, )    default(0), not null
#  summary(概要)                      :text             not null
#  work_date(作業日)                  :date             not null
#  created_at(作成日時)               :datetime         not null
#  updated_at(更新日時)               :datetime         not null
#  site_id(現場ID)                    :uuid             not null
#  tenant_id(自社ID)                  :uuid             not null
#
# Indexes
#
#  index_daily_reports_on_discarded_at                         (discarded_at)
#  index_daily_reports_on_site_id                              (site_id)
#  index_daily_reports_on_tenant_id                            (tenant_id)
#  index_daily_reports_on_tenant_id_and_site_id_and_work_date  (tenant_id,site_id,work_date)
#
# Foreign Keys
#
#  fk_rails_...  (site_id => sites.id)
#  fk_rails_...  (tenant_id => tenants.id)
#
FactoryBot.define do
  factory :daily_report do
    tenant
    site
    work_date { Date.current }
    summary { "テスト作業概要" }

    transient do
      entries_count { 1 }
      work_user { nil }
    end

    after(:build) do |daily_report, evaluator|
      if daily_report.work_entries.empty?
        user = evaluator.work_user || build(:user, tenant: daily_report.tenant)
        evaluator.entries_count.times do
          daily_report.work_entries << build(:work_entry, daily_report: daily_report, tenant: daily_report.tenant,
                                                          user: user)
        end
      end
    end

    trait :discarded do
      discarded_at { Time.current }
    end
  end
end
