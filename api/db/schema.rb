# This file is auto-generated from the current state of the database. Instead
# of editing this file, please use the migrations feature of Active Record to
# incrementally modify your database, and then regenerate this schema definition.
#
# This file is the source Rails uses to define your schema when running `bin/rails
# db:schema:load`. When creating a new database, `bin/rails db:schema:load` tends to
# be faster and is potentially less error prone than running all of your
# migrations from scratch. Old migrations may fail to apply correctly if those
# migrations use external dependencies or application code.
#
# It's strongly recommended that you check this file into your version control system.

ActiveRecord::Schema[7.1].define(version: 2025_12_13_025045) do
  # These are extensions that must be enabled in order to support this database
  enable_extension "pg_trgm"
  enable_extension "pgcrypto"
  enable_extension "plpgsql"

  create_table "bank_accounts", id: :uuid, default: -> { "gen_random_uuid()" }, comment: "口座情報", force: :cascade do |t|
    t.uuid "tenant_id", null: false, comment: "自社ID"
    t.string "bank_name", null: false, comment: "銀行名"
    t.string "branch_name", null: false, comment: "支店名"
    t.string "account_type", null: false, comment: "口座種別（ordinary/current/savings）"
    t.string "account_number", null: false, comment: "口座番号（暗号化）"
    t.string "account_holder", null: false, comment: "口座名義（暗号化）"
    t.boolean "is_default_for_invoice", default: false, null: false, comment: "請求書用デフォルト口座フラグ"
    t.datetime "discarded_at", comment: "削除日時（論理削除）"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["discarded_at"], name: "index_bank_accounts_on_discarded_at"
    t.index ["tenant_id"], name: "index_bank_accounts_on_tenant_id"
  end

  create_table "customers", id: { type: :uuid, default: -> { "gen_random_uuid()" }, comment: "ID" }, comment: "顧客", force: :cascade do |t|
    t.uuid "tenant_id", null: false, comment: "自社ID"
    t.string "name", null: false, comment: "顧客名"
    t.string "customer_type", comment: "企業区分（corporate: 法人 / individual: 個人）"
    t.string "corporation_number", comment: "法人番号（13桁、法人時必須）"
    t.integer "rate_percent", default: 100, comment: "掛率（0〜300%）"
    t.datetime "created_at", null: false, comment: "作成日時"
    t.datetime "updated_at", null: false, comment: "更新日時"
    t.text "note", comment: "備考"
    t.datetime "discarded_at", comment: "削除日時（論理削除）"
    t.index ["corporation_number"], name: "index_customers_on_corporation_number"
    t.index ["discarded_at"], name: "index_customers_on_discarded_at"
    t.index ["tenant_id", "name"], name: "index_customers_on_tenant_id_and_name"
    t.index ["tenant_id"], name: "index_customers_on_tenant_id"
  end

  create_table "daily_report_materials", id: :uuid, default: -> { "gen_random_uuid()" }, comment: "日報資材（中間テーブル）", force: :cascade do |t|
    t.uuid "daily_report_id", null: false, comment: "日報ID"
    t.uuid "material_id", null: false, comment: "資材ID"
    t.decimal "quantity", precision: 10, scale: 2, default: "1.0", null: false, comment: "数量"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["daily_report_id", "material_id"], name: "index_daily_report_materials_unique", unique: true
    t.index ["daily_report_id"], name: "index_daily_report_materials_on_daily_report_id"
    t.index ["material_id"], name: "index_daily_report_materials_on_material_id"
  end

  create_table "daily_report_products", id: :uuid, default: -> { "gen_random_uuid()" }, comment: "日報製品（中間テーブル）", force: :cascade do |t|
    t.uuid "daily_report_id", null: false, comment: "日報ID"
    t.uuid "product_id", null: false, comment: "製品ID"
    t.decimal "quantity", precision: 10, scale: 2, default: "1.0", null: false, comment: "数量"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["daily_report_id", "product_id"], name: "index_daily_report_products_unique", unique: true
    t.index ["daily_report_id"], name: "index_daily_report_products_on_daily_report_id"
    t.index ["product_id"], name: "index_daily_report_products_on_product_id"
  end

  create_table "daily_reports", id: { type: :uuid, default: -> { "gen_random_uuid()" }, comment: "ID" }, comment: "日報ヘッダ", force: :cascade do |t|
    t.uuid "tenant_id", null: false, comment: "自社ID"
    t.uuid "site_id", null: false, comment: "現場ID"
    t.date "work_date", null: false, comment: "作業日"
    t.uuid "created_by", comment: "作成者ID"
    t.datetime "created_at", null: false, comment: "作成日時"
    t.datetime "updated_at", null: false, comment: "更新日時"
    t.text "summary", null: false, comment: "概要"
    t.datetime "discarded_at", comment: "削除日時（論理削除）"
    t.decimal "labor_cost", precision: 12, default: "0", null: false
    t.index ["discarded_at"], name: "index_daily_reports_on_discarded_at"
    t.index ["site_id"], name: "index_daily_reports_on_site_id"
    t.index ["tenant_id", "site_id", "work_date"], name: "index_daily_reports_on_tenant_id_and_site_id_and_work_date"
    t.index ["tenant_id"], name: "index_daily_reports_on_tenant_id"
  end

  create_table "invoice_daily_reports", id: :uuid, default: -> { "gen_random_uuid()" }, comment: "請求書日報（中間テーブル）", force: :cascade do |t|
    t.uuid "invoice_id", null: false, comment: "請求書ID"
    t.uuid "daily_report_id", null: false, comment: "日報ID"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["daily_report_id"], name: "index_invoice_daily_reports_on_daily_report_id"
    t.index ["invoice_id", "daily_report_id"], name: "index_invoice_daily_reports_unique", unique: true
    t.index ["invoice_id"], name: "index_invoice_daily_reports_on_invoice_id"
  end

  create_table "invoice_items", id: :uuid, default: -> { "gen_random_uuid()" }, comment: "請求項目", force: :cascade do |t|
    t.uuid "invoice_id", null: false, comment: "請求書ID"
    t.string "item_type", null: false, comment: "項目タイプ（header/product/material/labor/other）"
    t.string "name", null: false, comment: "名称（コピー値、手動編集可）"
    t.decimal "quantity", precision: 10, scale: 2, comment: "数量（headerの場合はNULL）"
    t.string "unit", comment: "単位（式、個、m、時間等）"
    t.decimal "unit_price", precision: 12, comment: "単価（コピー値、headerの場合はNULL）"
    t.decimal "amount", precision: 12, comment: "金額（数量×単価、headerの場合はNULL）"
    t.integer "sort_order", default: 0, null: false, comment: "表示順"
    t.text "note", comment: "備考"
    t.uuid "source_product_id", comment: "元の製品ID（参照用）"
    t.uuid "source_material_id", comment: "元の資材ID（参照用）"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["invoice_id", "sort_order"], name: "index_invoice_items_on_invoice_id_and_sort_order"
    t.index ["invoice_id"], name: "index_invoice_items_on_invoice_id"
    t.index ["item_type"], name: "index_invoice_items_on_item_type"
    t.index ["source_material_id"], name: "index_invoice_items_on_source_material_id"
    t.index ["source_product_id"], name: "index_invoice_items_on_source_product_id"
  end

  create_table "invoices", id: :uuid, default: -> { "gen_random_uuid()" }, comment: "請求書", force: :cascade do |t|
    t.uuid "tenant_id", null: false, comment: "自社ID"
    t.uuid "customer_id", null: false, comment: "顧客ID"
    t.uuid "site_id", comment: "現場ID"
    t.uuid "created_by", comment: "作成者ID"
    t.string "invoice_number", comment: "請求書番号（自社内でユニーク、draftではNULL可）"
    t.string "title", comment: "タイトル"
    t.string "customer_name", null: false, comment: "顧客名（コピー値、手動編集可）"
    t.decimal "subtotal", precision: 12, default: "0", null: false, comment: "税抜合計金額"
    t.decimal "tax_rate", precision: 4, scale: 2, default: "10.0", null: false, comment: "適用税率（%）"
    t.decimal "tax_amount", precision: 12, default: "0", null: false, comment: "消費税額"
    t.decimal "total_amount", precision: 12, default: "0", null: false, comment: "税込合計金額"
    t.date "delivery_date", comment: "受渡期日"
    t.string "delivery_place", comment: "受渡場所"
    t.string "transaction_method", comment: "取引方法"
    t.date "valid_until", comment: "有効期限"
    t.text "note", comment: "備考"
    t.string "status", default: "draft", null: false, comment: "ステータス（draft/issued/canceled）"
    t.datetime "issued_at", comment: "発行日時"
    t.datetime "discarded_at", comment: "削除日時（論理削除）"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.date "billing_date", default: -> { "CURRENT_DATE" }, null: false
    t.index ["customer_id"], name: "index_invoices_on_customer_id"
    t.index ["discarded_at"], name: "index_invoices_on_discarded_at"
    t.index ["site_id"], name: "index_invoices_on_site_id"
    t.index ["status"], name: "index_invoices_on_status"
    t.index ["tenant_id", "invoice_number"], name: "index_invoices_on_tenant_id_and_invoice_number", unique: true, where: "(invoice_number IS NOT NULL)"
    t.index ["tenant_id"], name: "index_invoices_on_tenant_id"
    t.check_constraint "status::text <> 'draft'::text OR issued_at IS NULL", name: "invoices_draft_issued_at_check"
    t.check_constraint "status::text <> 'issued'::text OR issued_at IS NOT NULL AND invoice_number IS NOT NULL", name: "invoices_issued_check"
  end

  create_table "manufacturers", id: :uuid, default: -> { "gen_random_uuid()" }, comment: "メーカー", force: :cascade do |t|
    t.string "name", null: false, comment: "メーカー名"
    t.datetime "discarded_at", comment: "削除日時（論理削除）"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["discarded_at"], name: "index_manufacturers_on_discarded_at"
    t.index ["name"], name: "index_manufacturers_on_name", unique: true
  end

  create_table "materials", id: :uuid, default: -> { "gen_random_uuid()" }, comment: "資材", force: :cascade do |t|
    t.uuid "tenant_id", null: false, comment: "自社ID"
    t.string "name", null: false, comment: "名称"
    t.string "model_number", comment: "型番"
    t.string "unit", comment: "単位"
    t.decimal "unit_price", precision: 12, default: "0", null: false, comment: "単価"
    t.string "material_type", comment: "資材タイプ（自由入力）"
    t.datetime "discarded_at", comment: "削除日時（論理削除）"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["discarded_at"], name: "index_materials_on_discarded_at"
    t.index ["model_number"], name: "index_materials_on_model_number"
    t.index ["tenant_id", "name"], name: "index_materials_on_tenant_id_and_name"
    t.index ["tenant_id"], name: "index_materials_on_tenant_id"
  end

  create_table "products", id: :uuid, default: -> { "gen_random_uuid()" }, comment: "製品", force: :cascade do |t|
    t.uuid "tenant_id", null: false, comment: "自社ID"
    t.uuid "manufacturer_id", comment: "メーカーID"
    t.string "name", null: false, comment: "名称"
    t.string "model_number", comment: "型番"
    t.string "unit", comment: "単位"
    t.decimal "unit_price", precision: 12, default: "0", null: false, comment: "単価"
    t.datetime "discarded_at", comment: "削除日時（論理削除）"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["discarded_at"], name: "index_products_on_discarded_at"
    t.index ["manufacturer_id"], name: "index_products_on_manufacturer_id"
    t.index ["model_number"], name: "index_products_on_model_number"
    t.index ["tenant_id", "name"], name: "index_products_on_tenant_id_and_name"
    t.index ["tenant_id"], name: "index_products_on_tenant_id"
  end

  create_table "roles", id: { type: :uuid, default: -> { "gen_random_uuid()" }, comment: "ID" }, comment: "ロール（権限）", force: :cascade do |t|
    t.string "name", null: false, comment: "ロール名（admin, member等）"
    t.string "display_name", comment: "表示名"
    t.text "description", comment: "説明"
    t.datetime "created_at", null: false, comment: "作成日時"
    t.datetime "updated_at", null: false, comment: "更新日時"
    t.index ["name"], name: "index_roles_on_name", unique: true
  end

  create_table "sites", id: { type: :uuid, default: -> { "gen_random_uuid()" }, comment: "ID" }, comment: "現場", force: :cascade do |t|
    t.uuid "tenant_id", null: false, comment: "自社ID"
    t.uuid "customer_id", null: false, comment: "顧客ID"
    t.string "name", null: false, comment: "現場名"
    t.datetime "created_at", null: false, comment: "作成日時"
    t.datetime "updated_at", null: false, comment: "更新日時"
    t.datetime "discarded_at", comment: "削除日時（論理削除）"
    t.string "address"
    t.index ["customer_id"], name: "index_sites_on_customer_id"
    t.index ["discarded_at"], name: "index_sites_on_discarded_at"
    t.index ["tenant_id", "customer_id", "name"], name: "index_sites_on_tenant_id_and_customer_id_and_name", unique: true
    t.index ["tenant_id"], name: "index_sites_on_tenant_id"
  end

  create_table "tenant_settings", id: { type: :uuid, default: -> { "gen_random_uuid()" }, comment: "ID" }, comment: "自社設定", force: :cascade do |t|
    t.uuid "tenant_id", null: false, comment: "自社ID"
    t.integer "default_unit_rate", default: 3000, comment: "既定単価（円/時）"
    t.string "money_rounding", default: "round", comment: "丸めルール（round/ceil/floor）"
    t.datetime "created_at", null: false, comment: "作成日時"
    t.datetime "updated_at", null: false, comment: "更新日時"
    t.index ["tenant_id"], name: "index_tenant_settings_on_tenant_id"
  end

  create_table "tenants", id: { type: :uuid, default: -> { "gen_random_uuid()" }, comment: "ID" }, comment: "自社（会社）", force: :cascade do |t|
    t.string "name", null: false, comment: "会社名"
    t.datetime "created_at", null: false, comment: "作成日時"
    t.datetime "updated_at", null: false, comment: "更新日時"
    t.string "postal_code", comment: "郵便番号"
    t.string "address", comment: "住所"
    t.string "phone_number", comment: "電話番号"
    t.string "fax_number", comment: "FAX番号"
    t.string "corporate_number", comment: "法人番号（登録番号 / 13桁）"
    t.string "representative_name", comment: "代表者名"
    t.index ["name"], name: "index_tenants_on_name", unique: true
  end

  create_table "user_roles", id: { type: :uuid, default: -> { "gen_random_uuid()" }, comment: "ID" }, comment: "ユーザーロール（中間テーブル）", force: :cascade do |t|
    t.uuid "user_id", null: false, comment: "ユーザーID"
    t.uuid "role_id", null: false, comment: "ロールID"
    t.uuid "assigned_by_id", comment: "付与者ID"
    t.datetime "assigned_at", default: -> { "CURRENT_TIMESTAMP" }, null: false, comment: "付与日時"
    t.datetime "created_at", null: false, comment: "作成日時"
    t.datetime "updated_at", null: false, comment: "更新日時"
    t.index ["role_id"], name: "index_user_roles_on_role_id"
    t.index ["user_id", "role_id"], name: "index_user_roles_on_user_id_and_role_id", unique: true
    t.index ["user_id"], name: "index_user_roles_on_user_id"
  end

  create_table "users", id: { type: :uuid, default: -> { "gen_random_uuid()" }, comment: "ID" }, comment: "ユーザー", force: :cascade do |t|
    t.uuid "tenant_id", null: false, comment: "自社ID"
    t.string "display_name", null: false, comment: "表示名"
    t.boolean "is_active", default: true, null: false, comment: "有効フラグ"
    t.datetime "created_at", null: false, comment: "作成日時"
    t.datetime "updated_at", null: false, comment: "更新日時"
    t.string "email", default: "", null: false, comment: "メールアドレス"
    t.string "encrypted_password", default: "", null: false, comment: "暗号化パスワード"
    t.string "reset_password_token", comment: "パスワードリセットトークン"
    t.datetime "reset_password_sent_at", comment: "パスワードリセット送信日時"
    t.datetime "remember_created_at", comment: "ログイン記憶日時"
    t.integer "sign_in_count", default: 0, null: false, comment: "ログイン回数"
    t.datetime "current_sign_in_at", comment: "現在のログイン日時"
    t.datetime "last_sign_in_at", comment: "前回のログイン日時"
    t.string "current_sign_in_ip", comment: "現在のログインIP"
    t.string "last_sign_in_ip", comment: "前回のログインIP"
    t.string "invitation_token", comment: "招待トークン"
    t.datetime "invitation_created_at", comment: "招待作成日時"
    t.datetime "invitation_sent_at", comment: "招待送信日時"
    t.datetime "invitation_accepted_at", comment: "招待受諾日時"
    t.integer "invitation_limit", comment: "招待可能数"
    t.string "invited_by_type", comment: "招待者タイプ"
    t.bigint "invited_by_id", comment: "招待者ID"
    t.integer "invitations_count", default: 0, comment: "招待数"
    t.index ["email"], name: "index_users_on_email", unique: true
    t.index ["invitation_token"], name: "index_users_on_invitation_token", unique: true
    t.index ["invitations_count"], name: "index_users_on_invitations_count"
    t.index ["invited_by_id"], name: "index_users_on_invited_by_id"
    t.index ["invited_by_type", "invited_by_id"], name: "index_users_on_invited_by"
    t.index ["reset_password_token"], name: "index_users_on_reset_password_token", unique: true
    t.index ["tenant_id", "display_name"], name: "index_users_on_tenant_id_and_display_name"
    t.index ["tenant_id"], name: "index_users_on_tenant_id"
  end

  create_table "work_entries", id: { type: :uuid, default: -> { "gen_random_uuid()" }, comment: "ID" }, comment: "日報行（作業エントリ）", force: :cascade do |t|
    t.uuid "tenant_id", null: false, comment: "自社ID"
    t.uuid "daily_report_id", null: false, comment: "日報ヘッダID"
    t.uuid "user_id", null: false, comment: "作業者ID"
    t.text "summary", comment: "作業概要"
    t.integer "minutes", null: false, comment: "作業時間（分、15分刻み）"
    t.datetime "created_at", null: false, comment: "作成日時"
    t.datetime "updated_at", null: false, comment: "更新日時"
    t.index ["daily_report_id"], name: "index_work_entries_on_daily_report_id"
    t.index ["tenant_id", "daily_report_id", "user_id"], name: "idx_on_tenant_id_daily_report_id_user_id_0333b1538a"
    t.index ["tenant_id"], name: "index_work_entries_on_tenant_id"
    t.index ["user_id"], name: "index_work_entries_on_user_id"
    t.check_constraint "(minutes % 15) = 0 AND minutes >= 0", name: "work_entries_minutes_check"
  end

  add_foreign_key "bank_accounts", "tenants"
  add_foreign_key "customers", "tenants"
  add_foreign_key "daily_report_materials", "daily_reports", on_delete: :cascade
  add_foreign_key "daily_report_materials", "materials"
  add_foreign_key "daily_report_products", "daily_reports", on_delete: :cascade
  add_foreign_key "daily_report_products", "products"
  add_foreign_key "daily_reports", "sites"
  add_foreign_key "daily_reports", "tenants"
  add_foreign_key "invoice_daily_reports", "daily_reports", on_delete: :cascade
  add_foreign_key "invoice_daily_reports", "invoices", on_delete: :cascade
  add_foreign_key "invoice_items", "invoices", on_delete: :cascade
  add_foreign_key "invoice_items", "materials", column: "source_material_id", on_delete: :nullify
  add_foreign_key "invoice_items", "products", column: "source_product_id", on_delete: :nullify
  add_foreign_key "invoices", "customers"
  add_foreign_key "invoices", "sites"
  add_foreign_key "invoices", "tenants"
  add_foreign_key "invoices", "users", column: "created_by"
  add_foreign_key "materials", "tenants"
  add_foreign_key "products", "manufacturers"
  add_foreign_key "products", "tenants"
  add_foreign_key "sites", "customers"
  add_foreign_key "sites", "tenants"
  add_foreign_key "tenant_settings", "tenants"
  add_foreign_key "user_roles", "roles"
  add_foreign_key "user_roles", "users"
  add_foreign_key "user_roles", "users", column: "assigned_by_id"
  add_foreign_key "users", "tenants"
  add_foreign_key "work_entries", "daily_reports"
  add_foreign_key "work_entries", "tenants"
  add_foreign_key "work_entries", "users"
end
