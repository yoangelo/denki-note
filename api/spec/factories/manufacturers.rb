# == Schema Information
#
# Table name: manufacturers
#
#  id                                 :uuid             not null, primary key
#  discarded_at(削除日時（論理削除）) :datetime
#  name(メーカー名)                   :string           not null
#  created_at                         :datetime         not null
#  updated_at                         :datetime         not null
#
# Indexes
#
#  index_manufacturers_on_discarded_at  (discarded_at)
#  index_manufacturers_on_name          (name) UNIQUE
#
FactoryBot.define do
  factory :manufacturer do
    sequence(:name) { |n| "テストメーカー#{n}" }

    trait :discarded do
      discarded_at { Time.current }
    end
  end
end
