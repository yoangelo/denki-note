class RemoveSiteNameFromInvoices < ActiveRecord::Migration[7.1]
  def change
    remove_column :invoices, :site_name, :string
  end
end
