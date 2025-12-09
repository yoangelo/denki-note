# == Schema Information
#
# Table name: roles
#
#  id(ID)                            :uuid             not null, primary key
#  description(説明)                 :text
#  display_name(表示名)              :string
#  name(ロール名（admin, member等）) :string           not null
#  created_at(作成日時)              :datetime         not null
#  updated_at(更新日時)              :datetime         not null
#
# Indexes
#
#  index_roles_on_name  (name) UNIQUE
#
class Role < ApplicationRecord
  AVAILABLE_ROLES = ["admin", "member"].freeze

  has_many :user_roles, dependent: :destroy
  has_many :users, through: :user_roles

  validates :name, presence: true, uniqueness: true, inclusion: { in: AVAILABLE_ROLES }
  validates :display_name, presence: true
end
