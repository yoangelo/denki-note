class RemoveSourceProductAndMaterialFromInvoiceItems < ActiveRecord::Migration[7.1]
  def change
    remove_foreign_key :invoice_items, :products, column: :source_product_id
    remove_foreign_key :invoice_items, :materials, column: :source_material_id

    remove_index :invoice_items, :source_product_id
    remove_index :invoice_items, :source_material_id

    remove_column :invoice_items, :source_product_id, :uuid
    remove_column :invoice_items, :source_material_id, :uuid
  end
end
