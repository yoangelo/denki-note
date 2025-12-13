# == Schema Information
#
# Table name: invoice_items
#
#  id                                                           :uuid             not null, primary key
#  amount(金額（数量×単価、headerの場合はNULL）)                :decimal(12, )
#  item_type(項目タイプ（header/product/material/labor/other）) :string           not null
#  name(名称（コピー値、手動編集可）)                           :string           not null
#  note(備考)                                                   :text
#  quantity(数量（headerの場合はNULL）)                         :decimal(10, 2)
#  sort_order(表示順)                                           :integer          default(0), not null
#  unit(単位（式、個、m、時間等）)                              :string
#  unit_price(単価（コピー値、headerの場合はNULL）)             :decimal(12, )
#  created_at                                                   :datetime         not null
#  updated_at                                                   :datetime         not null
#  invoice_id(請求書ID)                                         :uuid             not null
#  source_material_id(元の資材ID（参照用）)                     :uuid
#  source_product_id(元の製品ID（参照用）)                      :uuid
#
# Indexes
#
#  index_invoice_items_on_invoice_id                 (invoice_id)
#  index_invoice_items_on_invoice_id_and_sort_order  (invoice_id,sort_order)
#  index_invoice_items_on_item_type                  (item_type)
#  index_invoice_items_on_source_material_id         (source_material_id)
#  index_invoice_items_on_source_product_id          (source_product_id)
#
# Foreign Keys
#
#  fk_rails_...  (invoice_id => invoices.id) ON DELETE => cascade
#  fk_rails_...  (source_material_id => materials.id) ON DELETE => nullify
#  fk_rails_...  (source_product_id => products.id) ON DELETE => nullify
#
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
