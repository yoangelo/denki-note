class RemoveInvoicesCanceledCheck < ActiveRecord::Migration[7.1]
  def up
    execute <<-SQL
      ALTER TABLE invoices DROP CONSTRAINT IF EXISTS invoices_canceled_check;
    SQL
  end

  def down
    execute <<-SQL
      ALTER TABLE invoices ADD CONSTRAINT invoices_canceled_check
      CHECK (status != 'canceled' OR discarded_at IS NOT NULL);
    SQL
  end
end
