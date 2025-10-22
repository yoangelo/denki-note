class CreateWorkEntries < ActiveRecord::Migration[7.1]
  def change
    create_table :work_entries, id: :uuid do |t|
      t.references :tenant, type: :uuid, null: false, foreign_key: true
      t.references :daily_report, type: :uuid, null: false, foreign_key: true
      t.references :user, type: :uuid, null: false, foreign_key: true
      t.string :summary
      t.integer :minutes, null: false
      t.string :client_entry_id

      t.timestamps
    end
    add_index :work_entries, [:tenant_id, :daily_report_id, :user_id]
    add_index :work_entries, [:tenant_id, :client_entry_id], unique: true
    add_check_constraint :work_entries, "minutes % 15 = 0 AND minutes >= 0", name: "work_entries_minutes_check"
  end
end
