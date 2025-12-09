# == Schema Information
#
# Table name: work_entries
#
#  id(ID)                            :uuid             not null, primary key
#  minutes(作業時間（分、15分刻み）) :integer          not null
#  summary(作業概要)                 :text
#  created_at(作成日時)              :datetime         not null
#  updated_at(更新日時)              :datetime         not null
#  daily_report_id(日報ヘッダID)     :uuid             not null
#  tenant_id(テナントID)             :uuid             not null
#  user_id(作業者ID)                 :uuid             not null
#
# Indexes
#
#  idx_on_tenant_id_daily_report_id_user_id_0333b1538a  (tenant_id,daily_report_id,user_id)
#  index_work_entries_on_daily_report_id                (daily_report_id)
#  index_work_entries_on_tenant_id                      (tenant_id)
#  index_work_entries_on_user_id                        (user_id)
#
# Foreign Keys
#
#  fk_rails_...  (daily_report_id => daily_reports.id)
#  fk_rails_...  (tenant_id => tenants.id)
#  fk_rails_...  (user_id => users.id)
#
class WorkEntry < ApplicationRecord
  belongs_to :tenant
  belongs_to :daily_report
  belongs_to :user

  validates :minutes, presence: true, numericality: {
    greater_than_or_equal_to: 0,
    message: "工数は0以上の値を入力してください",
  }
end
