FactoryBot.define do
  factory :bank_account do
    tenant
    bank_name { "テスト銀行" }
    branch_name { "テスト支店" }
    account_type { "ordinary" }
    sequence(:account_number) { |n| format("%07d", n) }
    account_holder { "カ）テストカイシャ" }
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
