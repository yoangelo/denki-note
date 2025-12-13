# == Schema Information
#
# Table name: daily_reports
#
#  id(ID)                             :uuid             not null, primary key
#  created_by(作成者ID)               :uuid
#  discarded_at(削除日時（論理削除）) :datetime
#  labor_cost                         :decimal(12, )    default(0), not null
#  summary(概要)                      :text             not null
#  work_date(作業日)                  :date             not null
#  created_at(作成日時)               :datetime         not null
#  updated_at(更新日時)               :datetime         not null
#  site_id(現場ID)                    :uuid             not null
#  tenant_id(自社ID)                  :uuid             not null
#
# Indexes
#
#  index_daily_reports_on_discarded_at                         (discarded_at)
#  index_daily_reports_on_site_id                              (site_id)
#  index_daily_reports_on_tenant_id                            (tenant_id)
#  index_daily_reports_on_tenant_id_and_site_id_and_work_date  (tenant_id,site_id,work_date)
#
# Foreign Keys
#
#  fk_rails_...  (site_id => sites.id)
#  fk_rails_...  (tenant_id => tenants.id)
#
class DailyReport < ApplicationRecord
  include Discard::Model

  belongs_to :tenant
  belongs_to :site
  has_many :work_entries, dependent: :destroy
  has_many :daily_report_products, dependent: :destroy
  has_many :products, through: :daily_report_products
  has_many :daily_report_materials, dependent: :destroy
  has_many :materials, through: :daily_report_materials
  has_many :invoice_daily_reports, dependent: :destroy
  has_many :invoices, through: :invoice_daily_reports

  # ネストした属性を受け入れる
  accepts_nested_attributes_for :work_entries, allow_destroy: true
  accepts_nested_attributes_for :daily_report_products, allow_destroy: true
  accepts_nested_attributes_for :daily_report_materials, allow_destroy: true

  validates :work_date, presence: true
  validates :summary, presence: { message: "作業概要を入力してください" }
  validate :must_have_work_entries

  before_save :calculate_labor_cost

  private

  def calculate_labor_cost
    hours = work_entries.sum(:minutes) / 60.0
    tenant_setting = tenant.tenant_setting
    unit_rate = tenant_setting&.default_unit_rate || 0
    rate = site.customer.rate_percent / 100.0
    self.labor_cost = (hours * unit_rate * rate).round
  end

  def must_have_work_entries
    return unless work_entries.empty? || work_entries.all? { |e| e.minutes.zero? }

    errors.add(:work_entries, "作業者と工数を設定してください")
  end
end
