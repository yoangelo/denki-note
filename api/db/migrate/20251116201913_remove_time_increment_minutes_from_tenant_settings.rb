class RemoveTimeIncrementMinutesFromTenantSettings < ActiveRecord::Migration[7.1]
  def change
    remove_column :tenant_settings, :time_increment_minutes, :integer
  end
end
