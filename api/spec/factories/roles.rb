FactoryBot.define do
  factory :role do
    trait :admin do
      name { 'admin' }
      display_name { '管理者' }
      description { 'システム管理者' }
    end

    trait :member do
      name { 'member' }
      display_name { 'メンバー' }
      description { '一般メンバー' }
    end
  end
end
