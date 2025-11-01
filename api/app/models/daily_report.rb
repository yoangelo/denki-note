# == Schema Information
#
# Table name: daily_reports
#
#  id         :uuid             not null, primary key
#  created_by :uuid
#  summary    :text             not null
#  work_date  :date             not null
#  created_at :datetime         not null
#  updated_at :datetime         not null
#  site_id    :uuid             not null
#  tenant_id  :uuid             not null
#
# Indexes
#
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
  belongs_to :tenant
  belongs_to :site
  has_many :work_entries, dependent: :destroy
  
  validates :work_date, presence: true
end
