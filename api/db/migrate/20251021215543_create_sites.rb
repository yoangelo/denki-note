class CreateSites < ActiveRecord::Migration[7.1]
  def change
    create_table :sites, id: :uuid do |t|
      t.references :tenant, type: :uuid, null: false, foreign_key: true
      t.references :customer, type: :uuid, null: false, foreign_key: true
      t.string :name, null: false
      t.text :note

      t.timestamps
    end
    add_index :sites, [:tenant_id, :customer_id, :name], unique: true
  end
end
