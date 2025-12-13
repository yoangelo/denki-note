# == Schema Information
#
# Table name: bank_accounts
#
#  id                                                   :uuid             not null, primary key
#  account_holder(口座名義（暗号化）)                   :string           not null
#  account_number(口座番号（暗号化）)                   :string           not null
#  account_type(口座種別（ordinary/current/savings）)   :string           not null
#  bank_name(銀行名)                                    :string           not null
#  branch_name(支店名)                                  :string           not null
#  discarded_at(削除日時（論理削除）)                   :datetime
#  is_default_for_invoice(請求書用デフォルト口座フラグ) :boolean          default(FALSE), not null
#  created_at                                           :datetime         not null
#  updated_at                                           :datetime         not null
#  tenant_id(自社ID)                                    :uuid             not null
#
# Indexes
#
#  index_bank_accounts_on_discarded_at  (discarded_at)
#  index_bank_accounts_on_tenant_id     (tenant_id)
#
# Foreign Keys
#
#  fk_rails_...  (tenant_id => tenants.id)
#
class BankAccount < ApplicationRecord
  include Discard::Model

  encrypts :account_number
  encrypts :account_holder

  belongs_to :tenant

  enum :account_type, {
    ordinary: "ordinary",
    current: "current",
    savings: "savings",
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
    return unless is_default_for_invoice && is_default_for_invoice_changed?

    tenant.bank_accounts.kept.where.not(id: id).update_all(is_default_for_invoice: false)
  end
end
