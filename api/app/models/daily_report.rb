# == Schema Information
#
# Table name: daily_reports
#
#  id           :uuid             not null, primary key
#  created_by   :uuid
#  discarded_at :datetime
#  summary      :text             not null
#  work_date    :date             not null
#  created_at   :datetime         not null
#  updated_at   :datetime         not null
#  site_id      :uuid             not null
#  tenant_id    :uuid             not null
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
class DailyReport < ApplicationRecord
  include Discard::Model

  belongs_to :tenant
  belongs_to :site
  has_many :work_entries, dependent: :destroy

  # ネストした属性を受け入れる
  accepts_nested_attributes_for :work_entries, allow_destroy: true

  validates :work_date, presence: true
  validates :summary, presence: { message: '作業概要を入力してください' }
  validates :site_id, presence: true
  validate :must_have_work_entries

  private

  def must_have_work_entries
    if work_entries.empty? || work_entries.all? { |e| e.minutes.zero? }
      errors.add(:work_entries, '作業者と工数を設定してください')
    end
  end
end
