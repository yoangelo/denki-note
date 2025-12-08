FactoryBot.define do
  factory :tenant do
    sequence(:name) { |n| "テスト会社#{n}" }
  end
end
