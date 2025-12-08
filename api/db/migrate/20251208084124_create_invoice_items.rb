class CreateInvoiceItems < ActiveRecord::Migration[7.1]
  def change
    create_table :invoice_items, id: :uuid, default: -> { "gen_random_uuid()" }, comment: "請求項目" do |t|
      t.uuid :invoice_id, null: false, comment: "請求書ID"
      t.string :item_type, null: false, comment: "項目タイプ（header/product/material/labor/other）"
      t.string :name, null: false, comment: "名称（コピー値、手動編集可）"
      t.decimal :quantity, precision: 10, scale: 2, comment: "数量（headerの場合はNULL）"
      t.string :unit, comment: "単位（式、個、m、時間等）"
      t.decimal :unit_price, precision: 12, scale: 0, comment: "単価（コピー値、headerの場合はNULL）"
      t.decimal :amount, precision: 12, scale: 0, comment: "金額（数量×単価、headerの場合はNULL）"
      t.integer :sort_order, null: false, default: 0, comment: "表示順"
      t.text :note, comment: "備考"
      t.uuid :source_product_id, comment: "元の製品ID（参照用）"
      t.uuid :source_material_id, comment: "元の資材ID（参照用）"

      t.timestamps
    end

    add_index :invoice_items, :invoice_id
    add_index :invoice_items, [:invoice_id, :sort_order]
    add_index :invoice_items, :item_type
    add_index :invoice_items, :source_product_id
    add_index :invoice_items, :source_material_id

    add_foreign_key :invoice_items, :invoices, on_delete: :cascade
    add_foreign_key :invoice_items, :products, column: :source_product_id, on_delete: :nullify
    add_foreign_key :invoice_items, :materials, column: :source_material_id, on_delete: :nullify
  end
end
