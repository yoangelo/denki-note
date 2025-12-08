class Manufacturer < ApplicationRecord
  include Discard::Model

  has_many :products, dependent: :nullify

  validates :name, presence: { message: "メーカー名を入力してください" }
  validates :name, uniqueness: { message: "このメーカー名は既に登録されています" }
end
