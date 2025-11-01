# == Schema Information
#
# Table name: work_entries
#
#  id              :uuid             not null, primary key
#  minutes         :integer          not null
#  summary         :text
#  created_at      :datetime         not null
#  updated_at      :datetime         not null
#  daily_report_id :uuid             not null
#  tenant_id       :uuid             not null
#  user_id         :uuid             not null
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

  validates :minutes, presence: true, numericality: { greater_than_or_equal_to: 0 }
  validate :minutes_must_be_multiple_of_15

  private

  def minutes_must_be_multiple_of_15
    errors.add(:minutes, "must be a multiple of 15") if minutes.present? && minutes % 15 != 0
  end
end
