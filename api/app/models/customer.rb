# == Schema Information
#
# Table name: customers
#
#  id                 :uuid             not null, primary key
#  corporation_number :string
#  customer_type      :string
#  name               :string           not null
#  rate_percent       :integer          default(100)
#  created_at         :datetime         not null
#  updated_at         :datetime         not null
#  tenant_id          :uuid             not null
#
# Indexes
#
#  index_customers_on_corporation_number  (corporation_number)
#  index_customers_on_tenant_id           (tenant_id)
#  index_customers_on_tenant_id_and_name  (tenant_id,name)
#
# Foreign Keys
#
#  fk_rails_...  (tenant_id => tenants.id)
#
class Customer < ApplicationRecord
  self.inheritance_column = :_type_disabled

  belongs_to :tenant
  has_many :sites, dependent: :destroy

  validates :name, presence: true
  validates :corporation_number, length: { is: 13 }, allow_blank: true
  validates :rate_percent, inclusion: { in: 0..300 }, allow_nil: true
  validates :customer_type, inclusion: { in: %w[individual corporation] }, allow_nil: true

  scope :search_by_name, ->(query) { where("name ILIKE ?", "%#{query}%") if query.present? }
end
