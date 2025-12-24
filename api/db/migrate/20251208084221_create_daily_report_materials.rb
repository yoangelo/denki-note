class CreateDailyReportMaterials < ActiveRecord::Migration[7.1]
  def change
    create_table :daily_report_materials, id: :uuid, default: -> { "gen_random_uuid()" }, comment: "日報資材（中間テーブル）" do |t|
      t.uuid :daily_report_id, null: false, comment: "日報ID"
      t.uuid :material_id, null: false, comment: "資材ID"
      t.decimal :quantity, precision: 10, scale: 2, null: false, default: 1, comment: "数量"

      t.timestamps
    end

    add_index :daily_report_materials, :daily_report_id
    add_index :daily_report_materials, :material_id
    add_index :daily_report_materials, [:daily_report_id, :material_id], unique: true, name: "index_daily_report_materials_unique"

    add_foreign_key :daily_report_materials, :daily_reports, on_delete: :cascade
    add_foreign_key :daily_report_materials, :materials
  end
end
