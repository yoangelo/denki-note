class AddColumnsToTenants < ActiveRecord::Migration[7.1]
  def change
    add_column :tenants, :postal_code, :string, comment: "郵便番号"
    add_column :tenants, :address, :string, comment: "住所"
    add_column :tenants, :phone_number, :string, comment: "電話番号"
    add_column :tenants, :fax_number, :string, comment: "FAX番号"
    add_column :tenants, :corporate_number, :string, comment: "法人番号（登録番号 / 13桁）"
    add_column :tenants, :representative_name, :string, comment: "代表者名"
  end
end
