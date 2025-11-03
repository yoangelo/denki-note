# == Schema Information
#
# Table name: user_roles
#
#  id             :uuid             not null, primary key
#  assigned_at    :datetime         not null
#  created_at     :datetime         not null
#  updated_at     :datetime         not null
#  assigned_by_id :uuid
#  role_id        :uuid             not null
#  user_id        :uuid             not null
#
# Indexes
#
#  index_user_roles_on_role_id              (role_id)
#  index_user_roles_on_user_id              (user_id)
#  index_user_roles_on_user_id_and_role_id  (user_id,role_id) UNIQUE
#
# Foreign Keys
#
#  fk_rails_...  (assigned_by_id => users.id)
#  fk_rails_...  (role_id => roles.id)
#  fk_rails_...  (user_id => users.id)
#
class UserRole < ApplicationRecord
  belongs_to :user
  belongs_to :role
  belongs_to :assigned_by, class_name: 'User', optional: true

  validates :user_id, uniqueness: { scope: :role_id }
  validates :role_id, presence: true

  before_create :set_assigned_at

  private

  def set_assigned_at
    self.assigned_at ||= Time.current
  end
end
