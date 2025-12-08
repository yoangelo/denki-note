class BankAccount < ApplicationRecord
  include Discard::Model

  encrypts :account_number
  encrypts :account_holder

  belongs_to :tenant

  enum account_type: {
    ordinary: "ordinary",
    current: "current",
    savings: "savings"
  }

  validates :bank_name, presence: { message: "銀行名を入力してください" }
  validates :branch_name, presence: { message: "支店名を入力してください" }
  validates :account_type, presence: { message: "口座種別を選択してください" }
  validates :account_number, presence: { message: "口座番号を入力してください" }
  validates :account_holder, presence: { message: "口座名義を入力してください" }

  before_save :ensure_single_default

  scope :default_for_invoice, -> { where(is_default_for_invoice: true) }

  def masked_account_number
    return nil if account_number.blank?
    "****#{account_number[-4..]}"
  end

  private

  def ensure_single_default
    if is_default_for_invoice && is_default_for_invoice_changed?
      tenant.bank_accounts.kept.where.not(id: id).update_all(is_default_for_invoice: false)
    end
  end
end
