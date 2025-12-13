# == Schema Information
#
# Table name: tenants
#
#  id(ID)                                        :uuid             not null, primary key
#  address(住所)                                 :string
#  corporate_number(法人番号（登録番号 / 13桁）) :string
#  fax_number(FAX番号)                           :string
#  name(会社名)                                  :string           not null
#  phone_number(電話番号)                        :string
#  postal_code(郵便番号)                         :string
#  representative_name(代表者名)                 :string
#  created_at(作成日時)                          :datetime         not null
#  updated_at(更新日時)                          :datetime         not null
#
# Indexes
#
#  index_tenants_on_name  (name) UNIQUE
#
FactoryBot.define do
  factory :tenant do
    sequence(:name) { |n| "テスト会社#{n}" }
  end
end
