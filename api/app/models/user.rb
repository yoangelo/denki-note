# == Schema Information
#
# Table name: users
#
#  id           :uuid             not null, primary key
#  display_name :string           not null
#  is_active    :boolean          default(TRUE), not null
#  created_at   :datetime         not null
#  updated_at   :datetime         not null
#  tenant_id    :uuid             not null
#
# Indexes
#
#  index_users_on_tenant_id                   (tenant_id)
#  index_users_on_tenant_id_and_display_name  (tenant_id,display_name)
#
# Foreign Keys
#
#  fk_rails_...  (tenant_id => tenants.id)
#
class User < ApplicationRecord
  belongs_to :tenant
  has_many :work_entries, dependent: :destroy
  
  validates :display_name, presence: true
  validates :is_active, inclusion: { in: [true, false] }
end
