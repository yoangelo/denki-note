FactoryBot.define do
  factory :user do
    tenant
    sequence(:email) { |n| "user#{n}@example.com" }
    sequence(:display_name) { |n| "テストユーザー#{n}" }
    password { "password123" }
    password_confirmation { "password123" }
    is_active { true }

    trait :admin do
      after(:create) do |user|
        admin_role = Role.find_or_create_by!(name: "admin") do |role|
          role.display_name = "管理者"
          role.description = "システム管理者"
        end
        user.roles << admin_role unless user.roles.include?(admin_role)
      end
    end

    trait :member do
      after(:create) do |user|
        member_role = Role.find_or_create_by!(name: "member") do |role|
          role.display_name = "メンバー"
          role.description = "一般メンバー"
        end
        user.roles << member_role unless user.roles.include?(member_role)
      end
    end

    trait :inactive do
      is_active { false }
    end
  end
end
