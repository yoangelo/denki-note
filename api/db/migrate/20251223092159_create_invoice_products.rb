class CreateInvoiceProducts < ActiveRecord::Migration[7.1]
  def change
    create_table :invoice_products, id: :uuid do |t|
      t.uuid :invoice_id, null: false, comment: "請求書ID"
      t.uuid :product_id, null: false, comment: "製品ID"

      t.timestamps
    end

    add_index :invoice_products, :invoice_id
    add_index :invoice_products, :product_id
    add_index :invoice_products, %i[invoice_id product_id], unique: true

    add_foreign_key :invoice_products, :invoices, on_delete: :cascade
    add_foreign_key :invoice_products, :products, on_delete: :cascade
  end
end
