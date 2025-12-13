class CreateInvoices < ActiveRecord::Migration[7.1]
  def change
    create_table :invoices, id: :uuid, default: -> { "gen_random_uuid()" }, comment: "請求書" do |t|
      t.uuid :tenant_id, null: false, comment: "自社ID"
      t.uuid :customer_id, null: false, comment: "顧客ID"
      t.uuid :site_id, comment: "現場ID"
      t.uuid :created_by, comment: "作成者ID"
      t.string :invoice_number, comment: "請求書番号（自社内でユニーク、draftではNULL可）"
      t.string :title, comment: "タイトル"
      t.string :customer_name, null: false, comment: "顧客名（コピー値、手動編集可）"
      t.string :site_name, comment: "現場名（コピー値、手動編集可）"
      t.decimal :subtotal, precision: 12, scale: 0, null: false, default: 0, comment: "税抜合計金額"
      t.decimal :tax_rate, precision: 4, scale: 2, null: false, default: 10.00, comment: "適用税率（%）"
      t.decimal :tax_amount, precision: 12, scale: 0, null: false, default: 0, comment: "消費税額"
      t.decimal :total_amount, precision: 12, scale: 0, null: false, default: 0, comment: "税込合計金額"
      t.date :delivery_date, comment: "受渡期日"
      t.string :delivery_place, comment: "受渡場所"
      t.string :transaction_method, comment: "取引方法"
      t.date :valid_until, comment: "有効期限"
      t.text :note, comment: "備考"
      t.string :status, null: false, default: "draft", comment: "ステータス（draft/issued/canceled）"
      t.datetime :issued_at, comment: "発行日時"
      t.datetime :discarded_at, comment: "削除日時（論理削除）"

      t.timestamps
    end

    add_index :invoices, :tenant_id
    add_index :invoices, :customer_id
    add_index :invoices, :site_id
    add_index :invoices, [:tenant_id, :invoice_number], unique: true, where: "invoice_number IS NOT NULL"
    add_index :invoices, :discarded_at
    add_index :invoices, :status

    add_foreign_key :invoices, :tenants
    add_foreign_key :invoices, :customers
    add_foreign_key :invoices, :sites
    add_foreign_key :invoices, :users, column: :created_by

    # CHECK制約
    # draft のとき issued_at は NULL
    execute <<-SQL
      ALTER TABLE invoices ADD CONSTRAINT invoices_draft_issued_at_check
      CHECK (status != 'draft' OR issued_at IS NULL);
    SQL

    # issued のとき issued_at と invoice_number は NOT NULL
    execute <<-SQL
      ALTER TABLE invoices ADD CONSTRAINT invoices_issued_check
      CHECK (status != 'issued' OR (issued_at IS NOT NULL AND invoice_number IS NOT NULL));
    SQL

    # canceled のとき discarded_at は NOT NULL
    execute <<-SQL
      ALTER TABLE invoices ADD CONSTRAINT invoices_canceled_check
      CHECK (status != 'canceled' OR discarded_at IS NOT NULL);
    SQL
  end
end
