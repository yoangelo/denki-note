# == Schema Information
#
# Table name: sites
#
#  id(ID)                             :uuid             not null, primary key
#  discarded_at(削除日時（論理削除）) :datetime
#  name(現場名)                       :string           not null
#  note(メモ)                         :text
#  created_at(作成日時)               :datetime         not null
#  updated_at(更新日時)               :datetime         not null
#  customer_id(顧客ID)                :uuid             not null
#  tenant_id(テナントID)              :uuid             not null
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
  has_many :invoices, dependent: :restrict_with_error

  validates :name, presence: { message: "現場名を入力してください" }
  validates :name, uniqueness: {
    scope: [:tenant_id, :customer_id],
    conditions: -> { kept },
    message: "この現場名は既に使用されています"
  }
end
