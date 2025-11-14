class AddDiscardedAtToDailyReports < ActiveRecord::Migration[7.1]
  def change
    add_column :daily_reports, :discarded_at, :datetime
    add_index :daily_reports, :discarded_at
  end
end
