# == Schema Information
#
# Table name: invoice_materials
#
#  id                   :uuid             not null, primary key
#  created_at           :datetime         not null
#  updated_at           :datetime         not null
#  invoice_id(請求書ID) :uuid             not null
#  material_id(資材ID)  :uuid             not null
#
# Indexes
#
#  index_invoice_materials_on_invoice_id                  (invoice_id)
#  index_invoice_materials_on_invoice_id_and_material_id  (invoice_id,material_id) UNIQUE
#  index_invoice_materials_on_material_id                 (material_id)
#
# Foreign Keys
#
#  fk_rails_...  (invoice_id => invoices.id) ON DELETE => cascade
#  fk_rails_...  (material_id => materials.id) ON DELETE => cascade
#
require "rails_helper"

RSpec.describe InvoiceMaterial do
  let(:tenant) { create(:tenant) }
  let(:customer) { create(:customer, tenant: tenant) }
  let(:invoice) { create(:invoice, :draft, tenant: tenant, customer: customer) }
  let(:material) { create(:material, tenant: tenant) }

  describe "associations" do
    it "belongs to invoice" do
      invoice_material = create(:invoice_material, invoice: invoice, material: material)
      expect(invoice_material.invoice).to eq(invoice)
    end

    it "belongs to material" do
      invoice_material = create(:invoice_material, invoice: invoice, material: material)
      expect(invoice_material.material).to eq(material)
    end
  end

  describe "validations" do
    it "creates a valid invoice_material" do
      invoice_material = build(:invoice_material, invoice: invoice, material: material)
      expect(invoice_material).to be_valid
    end

    it "validates uniqueness of invoice_id scoped to material_id" do
      create(:invoice_material, invoice: invoice, material: material)
      duplicate = build(:invoice_material, invoice: invoice, material: material)
      expect(duplicate).not_to be_valid
      expect(duplicate.errors[:invoice_id]).to include("この資材は既に登録されています")
    end
  end

  describe "cascade delete" do
    it "is deleted when invoice is deleted" do
      invoice_material = create(:invoice_material, invoice: invoice, material: material)
      expect { invoice.destroy }.to change(described_class, :count).by(-1)
      expect { invoice_material.reload }.to raise_error(ActiveRecord::RecordNotFound)
    end
  end
end
