# == Schema Information
#
# Table name: tenants
#
#  id(ID)               :uuid             not null, primary key
#  name(会社名)         :string           not null
#  created_at(作成日時) :datetime         not null
#  updated_at(更新日時) :datetime         not null
#
# Indexes
#
#  index_tenants_on_name  (name) UNIQUE
#
class Tenant < ApplicationRecord
  has_many :customers, dependent: :destroy
  has_many :sites, dependent: :destroy
  has_many :users, dependent: :destroy
  has_many :daily_reports, dependent: :destroy
  has_many :work_entries, dependent: :destroy
  has_one :tenant_setting, dependent: :destroy
  has_many :invoices, dependent: :destroy
  has_many :products, dependent: :destroy
  has_many :materials, dependent: :destroy
  has_many :bank_accounts, dependent: :destroy

  validates :name, presence: { message: "自社名を入力してください" }
  validates :name, uniqueness: { message: "この自社名は既に使用されています" }
end
