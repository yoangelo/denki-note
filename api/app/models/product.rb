class Product < ApplicationRecord
  include Discard::Model

  belongs_to :tenant
  belongs_to :manufacturer, optional: true
  has_many :daily_report_products, dependent: :destroy
  has_many :daily_reports, through: :daily_report_products
  has_many :invoice_items, foreign_key: :source_product_id, dependent: :nullify

  validates :name, presence: { message: "製品名を入力してください" }
  validates :unit_price, presence: { message: "単価を入力してください" },
    numericality: { greater_than_or_equal_to: 0, message: "単価は0以上で入力してください" }

  scope :search_by_name, ->(query) { where("name ILIKE ?", "%#{query}%") if query.present? }
  scope :search_by_model_number, ->(query) { where("model_number ILIKE ?", "%#{query}%") if query.present? }
end
