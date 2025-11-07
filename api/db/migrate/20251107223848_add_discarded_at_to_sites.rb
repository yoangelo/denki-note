class AddDiscardedAtToSites < ActiveRecord::Migration[7.1]
  def change
    add_column :sites, :discarded_at, :datetime
    add_index :sites, :discarded_at
  end
end
