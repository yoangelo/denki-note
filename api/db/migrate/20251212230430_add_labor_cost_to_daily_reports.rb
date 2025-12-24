class AddLaborCostToDailyReports < ActiveRecord::Migration[7.1]
  def change
    add_column :daily_reports, :labor_cost, :decimal, precision: 12, scale: 0, default: 0, null: false
  end
end
