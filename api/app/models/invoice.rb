class Invoice < ApplicationRecord
  include Discard::Model

  belongs_to :tenant
  belongs_to :customer
  belongs_to :site, optional: true
  belongs_to :creator, class_name: "User", foreign_key: :created_by, inverse_of: false, optional: true

  has_many :invoice_items, dependent: :destroy
  has_many :invoice_daily_reports, dependent: :destroy
  has_many :daily_reports, through: :invoice_daily_reports

  accepts_nested_attributes_for :invoice_items, allow_destroy: true

  enum :status, {
    draft: "draft",
    issued: "issued",
    canceled: "canceled",
  }

  validates :customer_id, presence: { message: "顧客を選択してください" }
  validates :customer_name, presence: { message: "顧客名を入力してください" }
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
    scope = scope.where(issued_at: Date.parse(from).beginning_of_day..) if from.present?
    scope = scope.where(issued_at: ..Date.parse(to).end_of_day) if to.present?
    scope
  }

  def issue
    return false unless draft?

    transaction do
      self.status = :issued
      self.issued_at = Time.current
      self.invoice_number = generate_invoice_number
      save!
    end
    true
  end

  def cancel
    return false if canceled?

    transaction do
      self.status = :canceled
      discard!
    end
    true
  end

  def copy_to_new_invoice
    new_invoice = dup
    new_invoice.status = :draft
    new_invoice.invoice_number = nil
    new_invoice.issued_at = nil
    new_invoice.discarded_at = nil

    invoice_items.each do |item|
      new_invoice.invoice_items.build(item.attributes.except("id", "invoice_id", "created_at", "updated_at"))
    end

    new_invoice
  end

  private

  def copy_customer_and_site_names
    self.customer_name ||= customer&.name
    self.site_name ||= site&.name
  end

  def calculate_amounts
    items_subtotal = invoice_items.reject(&:header?).sum do |item|
      item.amount || ((item.quantity || 0) * (item.unit_price || 0))
    end
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
    when "canceled"
      errors.add(:discarded_at, "は必須です") if discarded_at.blank?
    end
  end
end
