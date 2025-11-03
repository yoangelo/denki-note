class CreateUserRoles < ActiveRecord::Migration[7.1]
  def change
    create_table :user_roles, id: :uuid do |t|
      t.references :user, null: false, foreign_key: true, type: :uuid
      t.references :role, null: false, foreign_key: true, type: :uuid
      t.uuid :assigned_by_id
      t.datetime :assigned_at, null: false, default: -> { 'CURRENT_TIMESTAMP' }

      t.timestamps
    end

    add_index :user_roles, [:user_id, :role_id], unique: true
    add_foreign_key :user_roles, :users, column: :assigned_by_id
  end
end
