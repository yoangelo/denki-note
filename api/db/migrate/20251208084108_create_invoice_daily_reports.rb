class CreateInvoiceDailyReports < ActiveRecord::Migration[7.1]
  def change
    create_table :invoice_daily_reports, id: :uuid, default: -> { "gen_random_uuid()" }, comment: "請求書日報（中間テーブル）" do |t|
      t.uuid :invoice_id, null: false, comment: "請求書ID"
      t.uuid :daily_report_id, null: false, comment: "日報ID"

      t.timestamps
    end

    add_index :invoice_daily_reports, :invoice_id
    add_index :invoice_daily_reports, :daily_report_id
    add_index :invoice_daily_reports, [:invoice_id, :daily_report_id], unique: true, name: "index_invoice_daily_reports_unique"

    add_foreign_key :invoice_daily_reports, :invoices, on_delete: :cascade
    add_foreign_key :invoice_daily_reports, :daily_reports, on_delete: :cascade
  end
end
