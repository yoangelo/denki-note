class CreateInvoiceMaterials < ActiveRecord::Migration[7.1]
  def change
    create_table :invoice_materials, id: :uuid do |t|
      t.uuid :invoice_id, null: false, comment: "請求書ID"
      t.uuid :material_id, null: false, comment: "資材ID"

      t.timestamps
    end

    add_index :invoice_materials, :invoice_id
    add_index :invoice_materials, :material_id
    add_index :invoice_materials, %i[invoice_id material_id], unique: true

    add_foreign_key :invoice_materials, :invoices, on_delete: :cascade
    add_foreign_key :invoice_materials, :materials, on_delete: :cascade
  end
end
