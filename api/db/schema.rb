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

ActiveRecord::Schema[7.1].define(version: 2025_11_16_201913) do
  # These are extensions that must be enabled in order to support this database
  enable_extension "pg_trgm"
  enable_extension "pgcrypto"
  enable_extension "plpgsql"

  create_table "customers", id: :uuid, default: -> { "gen_random_uuid()" }, force: :cascade do |t|
    t.uuid "tenant_id", null: false
    t.string "name", null: false
    t.string "customer_type"
    t.string "corporation_number"
    t.integer "rate_percent", default: 100
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.text "note"
    t.datetime "discarded_at"
    t.index ["corporation_number"], name: "index_customers_on_corporation_number"
    t.index ["discarded_at"], name: "index_customers_on_discarded_at"
    t.index ["tenant_id", "name"], name: "index_customers_on_tenant_id_and_name"
    t.index ["tenant_id"], name: "index_customers_on_tenant_id"
  end

  create_table "daily_reports", id: :uuid, default: -> { "gen_random_uuid()" }, force: :cascade do |t|
    t.uuid "tenant_id", null: false
    t.uuid "site_id", null: false
    t.date "work_date", null: false
    t.uuid "created_by"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.text "summary", null: false
    t.datetime "discarded_at"
    t.index ["discarded_at"], name: "index_daily_reports_on_discarded_at"
    t.index ["site_id"], name: "index_daily_reports_on_site_id"
    t.index ["tenant_id", "site_id", "work_date"], name: "index_daily_reports_on_tenant_id_and_site_id_and_work_date"
    t.index ["tenant_id"], name: "index_daily_reports_on_tenant_id"
  end

  create_table "roles", id: :uuid, default: -> { "gen_random_uuid()" }, force: :cascade do |t|
    t.string "name", null: false
    t.string "display_name"
    t.text "description"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["name"], name: "index_roles_on_name", unique: true
  end

  create_table "sites", id: :uuid, default: -> { "gen_random_uuid()" }, force: :cascade do |t|
    t.uuid "tenant_id", null: false
    t.uuid "customer_id", null: false
    t.string "name", null: false
    t.text "note"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.datetime "discarded_at"
    t.index ["customer_id"], name: "index_sites_on_customer_id"
    t.index ["discarded_at"], name: "index_sites_on_discarded_at"
    t.index ["tenant_id", "customer_id", "name"], name: "index_sites_on_tenant_id_and_customer_id_and_name", unique: true
    t.index ["tenant_id"], name: "index_sites_on_tenant_id"
  end

  create_table "tenant_settings", id: :uuid, default: -> { "gen_random_uuid()" }, force: :cascade do |t|
    t.uuid "tenant_id", null: false
    t.integer "default_unit_rate", default: 3000
    t.string "money_rounding", default: "round"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["tenant_id"], name: "index_tenant_settings_on_tenant_id"
  end

  create_table "tenants", id: :uuid, default: -> { "gen_random_uuid()" }, force: :cascade do |t|
    t.string "name", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["name"], name: "index_tenants_on_name", unique: true
  end

  create_table "user_roles", id: :uuid, default: -> { "gen_random_uuid()" }, force: :cascade do |t|
    t.uuid "user_id", null: false
    t.uuid "role_id", null: false
    t.uuid "assigned_by_id"
    t.datetime "assigned_at", default: -> { "CURRENT_TIMESTAMP" }, null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["role_id"], name: "index_user_roles_on_role_id"
    t.index ["user_id", "role_id"], name: "index_user_roles_on_user_id_and_role_id", unique: true
    t.index ["user_id"], name: "index_user_roles_on_user_id"
  end

  create_table "users", id: :uuid, default: -> { "gen_random_uuid()" }, force: :cascade do |t|
    t.uuid "tenant_id", null: false
    t.string "display_name", null: false
    t.boolean "is_active", default: true, null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.string "email", default: "", null: false
    t.string "encrypted_password", default: "", null: false
    t.string "reset_password_token"
    t.datetime "reset_password_sent_at"
    t.datetime "remember_created_at"
    t.integer "sign_in_count", default: 0, null: false
    t.datetime "current_sign_in_at"
    t.datetime "last_sign_in_at"
    t.string "current_sign_in_ip"
    t.string "last_sign_in_ip"
    t.string "invitation_token"
    t.datetime "invitation_created_at"
    t.datetime "invitation_sent_at"
    t.datetime "invitation_accepted_at"
    t.integer "invitation_limit"
    t.string "invited_by_type"
    t.bigint "invited_by_id"
    t.integer "invitations_count", default: 0
    t.index ["email"], name: "index_users_on_email", unique: true
    t.index ["invitation_token"], name: "index_users_on_invitation_token", unique: true
    t.index ["invitations_count"], name: "index_users_on_invitations_count"
    t.index ["invited_by_id"], name: "index_users_on_invited_by_id"
    t.index ["invited_by_type", "invited_by_id"], name: "index_users_on_invited_by"
    t.index ["reset_password_token"], name: "index_users_on_reset_password_token", unique: true
    t.index ["tenant_id", "display_name"], name: "index_users_on_tenant_id_and_display_name"
    t.index ["tenant_id"], name: "index_users_on_tenant_id"
  end

  create_table "work_entries", id: :uuid, default: -> { "gen_random_uuid()" }, force: :cascade do |t|
    t.uuid "tenant_id", null: false
    t.uuid "daily_report_id", null: false
    t.uuid "user_id", null: false
    t.text "summary"
    t.integer "minutes", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["daily_report_id"], name: "index_work_entries_on_daily_report_id"
    t.index ["tenant_id", "daily_report_id", "user_id"], name: "idx_on_tenant_id_daily_report_id_user_id_0333b1538a"
    t.index ["tenant_id"], name: "index_work_entries_on_tenant_id"
    t.index ["user_id"], name: "index_work_entries_on_user_id"
    t.check_constraint "(minutes % 15) = 0 AND minutes >= 0", name: "work_entries_minutes_check"
  end

  add_foreign_key "customers", "tenants"
  add_foreign_key "daily_reports", "sites"
  add_foreign_key "daily_reports", "tenants"
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
