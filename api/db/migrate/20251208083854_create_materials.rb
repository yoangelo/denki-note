class CreateMaterials < ActiveRecord::Migration[7.1]
  def change
    create_table :materials, id: :uuid, default: -> { "gen_random_uuid()" }, comment: "資材" do |t|
      t.uuid :tenant_id, null: false, comment: "自社ID"
      t.string :name, null: false, comment: "名称"
      t.string :model_number, comment: "型番"
      t.string :unit, comment: "単位"
      t.decimal :unit_price, precision: 12, scale: 0, null: false, default: 0, comment: "単価"
      t.string :material_type, comment: "資材タイプ（自由入力）"
      t.datetime :discarded_at, comment: "削除日時（論理削除）"

      t.timestamps
    end

    add_index :materials, :tenant_id
    add_index :materials, [:tenant_id, :name]
    add_index :materials, :model_number
    add_index :materials, :discarded_at

    add_foreign_key :materials, :tenants
  end
end
