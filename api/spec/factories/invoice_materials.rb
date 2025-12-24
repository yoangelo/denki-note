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
FactoryBot.define do
  factory :invoice_material do
    invoice
    material
  end
end
