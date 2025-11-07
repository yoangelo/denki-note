class AddDiscardAndNoteToCustomers < ActiveRecord::Migration[7.1]
  def change
    add_column :customers, :note, :text
    add_column :customers, :discarded_at, :datetime
    add_index :customers, :discarded_at
  end
end
