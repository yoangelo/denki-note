# == Schema Information
#
# Table name: roles
#
#  id           :uuid             not null, primary key
#  description  :text
#  display_name :string
#  name         :string           not null
#  created_at   :datetime         not null
#  updated_at   :datetime         not null
#
# Indexes
#
#  index_roles_on_name  (name) UNIQUE
#
class Role < ApplicationRecord
  AVAILABLE_ROLES = %w[admin member].freeze

  has_many :user_roles, dependent: :destroy
  has_many :users, through: :user_roles

  validates :name, presence: true, uniqueness: true, inclusion: { in: AVAILABLE_ROLES }
  validates :display_name, presence: true
end
