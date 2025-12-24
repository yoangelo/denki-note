class RemoveNoteFromSites < ActiveRecord::Migration[7.1]
  def change
    remove_column :sites, :note, :text
  end
end
