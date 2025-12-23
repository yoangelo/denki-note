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
require "rails_helper"

RSpec.describe InvoiceProduct do
  let(:tenant) { create(:tenant) }
  let(:customer) { create(:customer, tenant: tenant) }
  let(:invoice) { create(:invoice, :draft, tenant: tenant, customer: customer) }
  let(:product) { create(:product, tenant: tenant) }

  describe "associations" do
    it "belongs to invoice" do
      invoice_product = create(:invoice_product, invoice: invoice, product: product)
      expect(invoice_product.invoice).to eq(invoice)
    end

    it "belongs to product" do
      invoice_product = create(:invoice_product, invoice: invoice, product: product)
      expect(invoice_product.product).to eq(product)
    end
  end

  describe "validations" do
    it "creates a valid invoice_product" do
      invoice_product = build(:invoice_product, invoice: invoice, product: product)
      expect(invoice_product).to be_valid
    end

    it "validates uniqueness of invoice_id scoped to product_id" do
      create(:invoice_product, invoice: invoice, product: product)
      duplicate = build(:invoice_product, invoice: invoice, product: product)
      expect(duplicate).not_to be_valid
      expect(duplicate.errors[:invoice_id]).to include("この製品は既に登録されています")
    end
  end

  describe "cascade delete" do
    it "is deleted when invoice is deleted" do
      invoice_product = create(:invoice_product, invoice: invoice, product: product)
      expect { invoice.destroy }.to change(described_class, :count).by(-1)
      expect { invoice_product.reload }.to raise_error(ActiveRecord::RecordNotFound)
    end
  end
end
