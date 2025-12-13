# == Schema Information
#
# Table name: daily_report_products
#
#  id                      :uuid             not null, primary key
#  quantity(数量)          :decimal(10, 2)   default(1.0), not null
#  created_at              :datetime         not null
#  updated_at              :datetime         not null
#  daily_report_id(日報ID) :uuid             not null
#  product_id(製品ID)      :uuid             not null
#
# Indexes
#
#  index_daily_report_products_on_daily_report_id  (daily_report_id)
#  index_daily_report_products_on_product_id       (product_id)
#  index_daily_report_products_unique              (daily_report_id,product_id) UNIQUE
#
# Foreign Keys
#
#  fk_rails_...  (daily_report_id => daily_reports.id) ON DELETE => cascade
#  fk_rails_...  (product_id => products.id)
#
FactoryBot.define do
  factory :daily_report_product do
    daily_report
    product
    quantity { 1 }
  end
end
