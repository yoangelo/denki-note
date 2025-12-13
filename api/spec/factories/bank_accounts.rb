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
FactoryBot.define do
  factory :bank_account do
    tenant
    bank_name { "テスト銀行" }
    branch_name { "テスト支店" }
    account_type { "ordinary" }
    sequence(:account_number) { |n| format("%07d", n) }
    account_holder { "テスト口座名義" }
    is_default_for_invoice { false }

    trait :default do
      is_default_for_invoice { true }
    end

    trait :current_account do
      account_type { "current" }
    end

    trait :savings_account do
      account_type { "savings" }
    end

    trait :discarded do
      discarded_at { Time.current }
    end
  end
end
