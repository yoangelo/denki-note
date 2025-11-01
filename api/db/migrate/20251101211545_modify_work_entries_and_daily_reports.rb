class ModifyWorkEntriesAndDailyReports < ActiveRecord::Migration[7.1]
  def change
    # work_entriesテーブルの変更
    remove_column :work_entries, :client_entry_id, :string
    change_column :work_entries, :summary, :text
    
    # daily_reportsテーブルにsummaryカラムを追加
    add_column :daily_reports, :summary, :text, null: false, default: ""
    
    # デフォルト値を削除（既存データへの適用後）
    change_column_default :daily_reports, :summary, nil
  end
end
