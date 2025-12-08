class CreateBankAccounts < ActiveRecord::Migration[7.1]
  def change
    create_table :bank_accounts, id: :uuid, default: -> { "gen_random_uuid()" }, comment: "口座情報" do |t|
      t.uuid :tenant_id, null: false, comment: "自社ID"
      t.string :bank_name, null: false, comment: "銀行名"
      t.string :branch_name, null: false, comment: "支店名"
      t.string :account_type, null: false, comment: "口座種別（ordinary/current/savings）"
      t.string :account_number, null: false, comment: "口座番号（暗号化）"
      t.string :account_holder, null: false, comment: "口座名義（暗号化）"
      t.boolean :is_default_for_invoice, null: false, default: false, comment: "請求書用デフォルト口座フラグ"
      t.datetime :discarded_at, comment: "削除日時（論理削除）"

      t.timestamps
    end

    add_index :bank_accounts, :tenant_id
    add_index :bank_accounts, :discarded_at

    add_foreign_key :bank_accounts, :tenants
  end
end
