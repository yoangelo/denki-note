class CreateDailyReports < ActiveRecord::Migration[7.1]
  def change
    create_table :daily_reports, id: :uuid do |t|
      t.references :tenant, type: :uuid, null: false, foreign_key: true
      t.references :site, type: :uuid, null: false, foreign_key: true
      t.date :work_date, null: false
      t.uuid :created_by

      t.timestamps
    end
    add_index :daily_reports, [:tenant_id, :site_id, :work_date]
  end
end
