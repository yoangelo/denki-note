class FixTenantComments < ActiveRecord::Migration[7.1]
  def change
    change_table_comment :tenants, from: "顧客（会社）", to: "自社（会社）"
    change_table_comment :tenant_settings, from: "テナント設定", to: "自社設定"

    change_column_comment :tenant_settings, :tenant_id, from: "テナントID", to: "自社ID"
    change_column_comment :customers, :tenant_id, from: "テナントID", to: "自社ID"
    change_column_comment :sites, :tenant_id, from: "テナントID", to: "自社ID"
    change_column_comment :users, :tenant_id, from: "テナントID", to: "自社ID"
    change_column_comment :daily_reports, :tenant_id, from: "テナントID", to: "自社ID"
    change_column_comment :work_entries, :tenant_id, from: "テナントID", to: "自社ID"
  end
end
