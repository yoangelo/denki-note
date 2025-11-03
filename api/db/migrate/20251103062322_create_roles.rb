class CreateRoles < ActiveRecord::Migration[7.1]
  def change
    create_table :roles, id: :uuid do |t|
      t.string :name, null: false
      t.string :display_name
      t.text :description

      t.timestamps
    end

    add_index :roles, :name, unique: true
  end
end
