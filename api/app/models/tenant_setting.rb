# == Schema Information
#
# Table name: tenant_settings
#
#  id                :uuid             not null, primary key
#  default_unit_rate :integer          default(3000)
#  money_rounding    :string           default("round")
#  created_at        :datetime         not null
#  updated_at        :datetime         not null
#  tenant_id         :uuid             not null
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

  validates :default_unit_rate,
    presence: { message: '基本時間単価を入力してください' },
    numericality: {
      only_integer: true,
      greater_than_or_equal_to: 0,
      message: '基本時間単価は0以上の整数で入力してください'
    }

  validates :money_rounding,
    presence: { message: '金額丸め方式を選択してください' },
    inclusion: {
      in: %w[round ceil floor],
      message: '金額丸め方式は四捨五入、切り上げ、切り捨てのいずれかを選択してください'
    }
end
