class RenameTypeToCustomerTypeInCustomers < ActiveRecord::Migration[7.1]
  def change
    rename_column :customers, :type, :customer_type
  end
end
