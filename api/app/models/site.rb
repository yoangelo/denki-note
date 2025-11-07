# == Schema Information
#
# Table name: sites
#
#  id           :uuid             not null, primary key
#  discarded_at :datetime
#  name         :string           not null
#  note         :text
#  created_at   :datetime         not null
#  updated_at   :datetime         not null
#  customer_id  :uuid             not null
#  tenant_id    :uuid             not null
#
# Indexes
#
#  index_sites_on_customer_id                         (customer_id)
#  index_sites_on_discarded_at                        (discarded_at)
#  index_sites_on_tenant_id                           (tenant_id)
#  index_sites_on_tenant_id_and_customer_id_and_name  (tenant_id,customer_id,name) UNIQUE
#
# Foreign Keys
#
#  fk_rails_...  (customer_id => customers.id)
#  fk_rails_...  (tenant_id => tenants.id)
#
class Site < ApplicationRecord
  include Discard::Model

  belongs_to :tenant
  belongs_to :customer
  has_many :daily_reports, dependent: :destroy

  validates :name, presence: { message: "現場名を入力してください" }
  validates :name, uniqueness: {
    scope: [:tenant_id, :customer_id],
    conditions: -> { kept },
    message: "この現場名は既に使用されています"
  }
end
