class InvoiceItem < ApplicationRecord
  belongs_to :invoice
  belongs_to :source_product, class_name: "Product", optional: true
  belongs_to :source_material, class_name: "Material", optional: true

  enum :item_type, {
    header: "header",
    product: "product",
    material: "material",
    labor: "labor",
    other: "other",
  }

  validates :item_type, presence: { message: "項目タイプを選択してください" }
  validates :name, presence: { message: "名称を入力してください" }
  validates :quantity, numericality: { greater_than: 0, message: "数量は0より大きい値を入力してください" }, allow_nil: true
  validates :unit_price, numericality: { greater_than_or_equal_to: 0, message: "単価は0以上で入力してください" }, allow_nil: true

  before_save :calculate_amount

  default_scope { order(sort_order: :asc) }

  def header?
    item_type == "header"
  end

  private

  def calculate_amount
    return if header?

    self.amount = (quantity || 0) * (unit_price || 0) if quantity.present? && unit_price.present?
  end
end
