class CreateTenantSettings < ActiveRecord::Migration[7.1]
  def change
    create_table :tenant_settings, id: :uuid do |t|
      t.references :tenant, type: :uuid, null: false, foreign_key: true
      t.integer :default_unit_rate, default: 3000
      t.integer :time_increment_minutes, default: 15
      t.string :money_rounding, default: 'round'

      t.timestamps
    end
  end
end
