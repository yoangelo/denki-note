# == Schema Information
#
# Table name: invoices
#
#  id                                                              :uuid             not null, primary key
#  billing_date                                                    :date             not null
#  created_by(作成者ID)                                            :uuid
#  customer_name(顧客名（コピー値、手動編集可）)                   :string           not null
#  delivery_date(受渡期日)                                         :date
#  delivery_place(受渡場所)                                        :string
#  discarded_at(削除日時（論理削除）)                              :datetime
#  invoice_number(請求書番号（自社内でユニーク、draftではNULL可）) :string
#  issued_at(発行日時)                                             :datetime
#  note(備考)                                                      :text
#  status(ステータス（draft/issued/canceled）)                     :string           default("draft"), not null
#  subtotal(税抜合計金額)                                          :decimal(12, )    default(0), not null
#  tax_amount(消費税額)                                            :decimal(12, )    default(0), not null
#  tax_rate(適用税率（%）)                                         :decimal(4, 2)    default(10.0), not null
#  title(タイトル)                                                 :string
#  total_amount(税込合計金額)                                      :decimal(12, )    default(0), not null
#  transaction_method(取引方法)                                    :string
#  valid_until(有効期限)                                           :date
#  created_at                                                      :datetime         not null
#  updated_at                                                      :datetime         not null
#  customer_id(顧客ID)                                             :uuid             not null
#  site_id(現場ID)                                                 :uuid
#  tenant_id(自社ID)                                               :uuid             not null
#
# Indexes
#
#  index_invoices_on_customer_id                   (customer_id)
#  index_invoices_on_discarded_at                  (discarded_at)
#  index_invoices_on_site_id                       (site_id)
#  index_invoices_on_status                        (status)
#  index_invoices_on_tenant_id                     (tenant_id)
#  index_invoices_on_tenant_id_and_invoice_number  (tenant_id,invoice_number) UNIQUE WHERE (invoice_number IS NOT NULL)
#
# Foreign Keys
#
#  fk_rails_...  (created_by => users.id)
#  fk_rails_...  (customer_id => customers.id)
#  fk_rails_...  (site_id => sites.id)
#  fk_rails_...  (tenant_id => tenants.id)
#
class Invoice < ApplicationRecord
  include Discard::Model

  belongs_to :tenant
  belongs_to :customer
  belongs_to :site, optional: true
  belongs_to :creator, class_name: "User", foreign_key: :created_by, inverse_of: false, optional: true

  has_many :invoice_items, dependent: :destroy
  has_many :invoice_daily_reports, dependent: :destroy
  has_many :daily_reports, through: :invoice_daily_reports
  has_many :invoice_products, dependent: :destroy
  has_many :products, through: :invoice_products
  has_many :invoice_materials, dependent: :destroy
  has_many :materials, through: :invoice_materials

  accepts_nested_attributes_for :invoice_items, allow_destroy: true

  enum :status, {
    draft: "draft",
    issued: "issued",
    canceled: "canceled",
  }

  validates :customer_id, presence: { message: "顧客を選択してください" }
  validates :customer_name, presence: { message: "顧客名を入力してください" }
  validates :billing_date, presence: true
  validates :tax_rate, presence: true,
                       numericality: { greater_than_or_equal_to: 0, less_than_or_equal_to: 100 }
  validates :status, inclusion: { in: statuses.keys }

  validate :validate_status_constraints

  before_validation :copy_customer_and_site_names, on: :create
  before_save :calculate_amounts

  scope :filter_by_customer, ->(customer_id) { where(customer_id: customer_id) if customer_id.present? }
  scope :filter_by_site, ->(site_id) { where(site_id: site_id) if site_id.present? }
  scope :filter_by_status, ->(status) { where(status: status) if status.present? }
  scope :filter_by_issued_date_range, lambda { |from, to|
    scope = all
    scope = scope.where(issued_at: from.beginning_of_day..) if from.present?
    scope = scope.where(issued_at: ..to.end_of_day) if to.present?
    scope
  }

  def issue
    return false unless draft?

    reload
    transaction do
      self.status = :issued
      self.issued_at = Time.current
      self.invoice_number = generate_invoice_number
      calculate_amounts
      save!
    end
    true
  end

  def cancel
    return false if canceled?

    self.status = :canceled
    save
  end

  def copy_to_new_invoice
    new_invoice = dup
    new_invoice.status = :draft
    new_invoice.invoice_number = nil
    new_invoice.issued_at = nil
    new_invoice.discarded_at = nil
    new_invoice.billing_date = Time.zone.today

    invoice_items.each do |item|
      new_invoice.invoice_items.build(item.attributes.except("id", "invoice_id", "created_at", "updated_at"))
    end

    new_invoice
  end

  private

  def copy_customer_and_site_names
    self.customer_name ||= customer&.name
  end

  def calculate_amounts
    items_subtotal = invoice_items.reject(&:header?).sum { |item| item.amount || 0 }
    self.subtotal = items_subtotal
    self.tax_amount = (subtotal * tax_rate / 100).floor
    self.total_amount = subtotal + tax_amount
  end

  def generate_invoice_number
    year = Time.current.year
    prefix = "INV-#{year}-"

    last_number = tenant.invoices
                        .where("invoice_number LIKE ?", "#{prefix}%")
                        .order(invoice_number: :desc)
                        .pick(:invoice_number)

    seq = if last_number
            last_number.split("-").last.to_i + 1
          else
            1
          end

    format("#{prefix}%03d", seq)
  end

  def validate_status_constraints
    case status
    when "draft"
      errors.add(:issued_at, "は下書きでは設定できません") if issued_at.present?
    when "issued"
      errors.add(:invoice_number, "は必須です") if invoice_number.blank?
      errors.add(:issued_at, "は必須です") if issued_at.blank?
      errors.add(:total_amount, "は0より大きい値が必要です") if total_amount <= 0
      errors.add(:base, "請求項目が必要です") if invoice_items.reject(&:header?).empty?
    end
  end
end
