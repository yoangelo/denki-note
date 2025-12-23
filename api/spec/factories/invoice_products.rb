# == Schema Information
#
# Table name: invoice_products
#
#  id                   :uuid             not null, primary key
#  created_at           :datetime         not null
#  updated_at           :datetime         not null
#  invoice_id(請求書ID) :uuid             not null
#  product_id(製品ID)   :uuid             not null
#
# Indexes
#
#  index_invoice_products_on_invoice_id                 (invoice_id)
#  index_invoice_products_on_invoice_id_and_product_id  (invoice_id,product_id) UNIQUE
#  index_invoice_products_on_product_id                 (product_id)
#
# Foreign Keys
#
#  fk_rails_...  (invoice_id => invoices.id) ON DELETE => cascade
#  fk_rails_...  (product_id => products.id) ON DELETE => cascade
#
FactoryBot.define do
  factory :invoice_product do
    invoice
    product
  end
end
