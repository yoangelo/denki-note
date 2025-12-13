class CreateProducts < ActiveRecord::Migration[7.1]
  def change
    create_table :products, id: :uuid, default: -> { "gen_random_uuid()" }, comment: "製品" do |t|
      t.uuid :tenant_id, null: false, comment: "自社ID"
      t.uuid :manufacturer_id, comment: "メーカーID"
      t.string :name, null: false, comment: "名称"
      t.string :model_number, comment: "型番"
      t.string :unit, comment: "単位"
      t.decimal :unit_price, precision: 12, scale: 0, null: false, default: 0, comment: "単価"
      t.datetime :discarded_at, comment: "削除日時（論理削除）"

      t.timestamps
    end

    add_index :products, :tenant_id
    add_index :products, :manufacturer_id
    add_index :products, [:tenant_id, :name]
    add_index :products, :model_number
    add_index :products, :discarded_at

    add_foreign_key :products, :tenants
    add_foreign_key :products, :manufacturers
  end
end
