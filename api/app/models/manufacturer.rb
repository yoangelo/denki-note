# == Schema Information
#
# Table name: manufacturers
#
#  id                                 :uuid             not null, primary key
#  discarded_at(削除日時（論理削除）) :datetime
#  name(メーカー名)                   :string           not null
#  created_at                         :datetime         not null
#  updated_at                         :datetime         not null
#
# Indexes
#
#  index_manufacturers_on_discarded_at  (discarded_at)
#  index_manufacturers_on_name          (name) UNIQUE
#
class Manufacturer < ApplicationRecord
  include Discard::Model

  has_many :products, dependent: :nullify

  validates :name, presence: { message: "メーカー名を入力してください" }
  validates :name, uniqueness: { message: "このメーカー名は既に登録されています" }
end
