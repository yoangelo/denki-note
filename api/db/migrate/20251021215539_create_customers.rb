class CreateCustomers < ActiveRecord::Migration[7.1]
  def change
    create_table :customers, id: :uuid do |t|
      t.references :tenant, type: :uuid, null: false, foreign_key: true
      t.string :name, null: false
      t.string :type
      t.string :corporation_number
      t.integer :rate_percent, default: 100
      t.integer :unit_rate

      t.timestamps
    end
    add_index :customers, [:tenant_id, :name]
    add_index :customers, :corporation_number
  end
end
