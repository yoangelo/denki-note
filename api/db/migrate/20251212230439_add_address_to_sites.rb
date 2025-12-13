class AddAddressToSites < ActiveRecord::Migration[7.1]
  def change
    add_column :sites, :address, :string
  end
end
