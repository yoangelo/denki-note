# == Schema Information
#
# Table name: tenant_settings
#
#  id                     :uuid             not null, primary key
#  default_unit_rate      :integer          default(3000)
#  money_rounding         :string           default("round")
#  time_increment_minutes :integer          default(15)
#  created_at             :datetime         not null
#  updated_at             :datetime         not null
#  tenant_id              :uuid             not null
#
# Indexes
#
#  index_tenant_settings_on_tenant_id  (tenant_id)
#
# Foreign Keys
#
#  fk_rails_...  (tenant_id => tenants.id)
#
class TenantSetting < ApplicationRecord
  belongs_to :tenant
  
  validates :default_unit_rate, presence: true, numericality: { greater_than_or_equal_to: 0 }
  validates :time_increment_minutes, presence: true, inclusion: { in: [15, 30, 60] }
  validates :money_rounding, presence: true, inclusion: { in: %w[round ceil floor] }
end
