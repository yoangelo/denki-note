class CreateDailyReportProducts < ActiveRecord::Migration[7.1]
  def change
    create_table :daily_report_products, id: :uuid, default: -> { "gen_random_uuid()" }, comment: "日報製品（中間テーブル）" do |t|
      t.uuid :daily_report_id, null: false, comment: "日報ID"
      t.uuid :product_id, null: false, comment: "製品ID"
      t.decimal :quantity, precision: 10, scale: 2, null: false, default: 1, comment: "数量"

      t.timestamps
    end

    add_index :daily_report_products, :daily_report_id
    add_index :daily_report_products, :product_id
    add_index :daily_report_products, [:daily_report_id, :product_id], unique: true, name: "index_daily_report_products_unique"

    add_foreign_key :daily_report_products, :daily_reports, on_delete: :cascade
    add_foreign_key :daily_report_products, :products
  end
end
