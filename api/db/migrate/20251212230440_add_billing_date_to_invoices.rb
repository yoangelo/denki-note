class AddBillingDateToInvoices < ActiveRecord::Migration[7.1]
  def change
    add_column :invoices, :billing_date, :date, null: false, default: -> { 'CURRENT_DATE' }
  end
end
