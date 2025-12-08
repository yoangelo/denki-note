class InvoiceDailyReport < ApplicationRecord
  belongs_to :invoice
  belongs_to :daily_report

  validates :invoice_id, uniqueness: { scope: :daily_report_id, message: "この日報は既に紐付けられています" }
end
