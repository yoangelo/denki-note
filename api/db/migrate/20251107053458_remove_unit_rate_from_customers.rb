class RemoveUnitRateFromCustomers < ActiveRecord::Migration[7.1]
  def change
    remove_column :customers, :unit_rate, :integer
  end
end
