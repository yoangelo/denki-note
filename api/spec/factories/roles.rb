# == Schema Information
#
# Table name: roles
#
#  id(ID)                            :uuid             not null, primary key
#  description(説明)                 :text
#  display_name(表示名)              :string
#  name(ロール名（admin, member等）) :string           not null
#  created_at(作成日時)              :datetime         not null
#  updated_at(更新日時)              :datetime         not null
#
# Indexes
#
#  index_roles_on_name  (name) UNIQUE
#
FactoryBot.define do
  factory :role do
    trait :admin do
      name { "admin" }
      display_name { "管理者" }
      description { "システム管理者" }
    end

    trait :member do
      name { "member" }
      display_name { "メンバー" }
      description { "一般メンバー" }
    end
  end
end
