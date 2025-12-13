# == Schema Information
#
# Table name: invoice_daily_reports
#
#  id                      :uuid             not null, primary key
#  created_at              :datetime         not null
#  updated_at              :datetime         not null
#  daily_report_id(日報ID) :uuid             not null
#  invoice_id(請求書ID)    :uuid             not null
#
# Indexes
#
#  index_invoice_daily_reports_on_daily_report_id  (daily_report_id)
#  index_invoice_daily_reports_on_invoice_id       (invoice_id)
#  index_invoice_daily_reports_unique              (invoice_id,daily_report_id) UNIQUE
#
# Foreign Keys
#
#  fk_rails_...  (daily_report_id => daily_reports.id) ON DELETE => cascade
#  fk_rails_...  (invoice_id => invoices.id) ON DELETE => cascade
#
FactoryBot.define do
  factory :invoice_daily_report do
    invoice
    daily_report
  end
end
