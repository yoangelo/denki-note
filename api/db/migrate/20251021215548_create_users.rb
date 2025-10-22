class CreateUsers < ActiveRecord::Migration[7.1]
  def change
    create_table :users, id: :uuid do |t|
      t.references :tenant, type: :uuid, null: false, foreign_key: true
      t.string :display_name, null: false
      t.boolean :is_active, default: true, null: false

      t.timestamps
    end
    add_index :users, [:tenant_id, :display_name]
  end
end
