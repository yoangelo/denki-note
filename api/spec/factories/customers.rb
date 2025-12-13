# == Schema Information
#
# Table name: customers
#
#  id(ID)                                                        :uuid             not null, primary key
#  corporation_number(法人番号（13桁、法人時必須）)              :string
#  customer_type(企業区分（corporate: 法人 / individual: 個人）) :string
#  discarded_at(削除日時（論理削除）)                            :datetime
#  name(顧客名)                                                  :string           not null
#  note(備考)                                                    :text
#  rate_percent(掛率（0〜300%）)                                 :integer          default(100)
#  created_at(作成日時)                                          :datetime         not null
#  updated_at(更新日時)                                          :datetime         not null
#  tenant_id(自社ID)                                             :uuid             not null
#
# Indexes
#
#  index_customers_on_corporation_number  (corporation_number)
#  index_customers_on_discarded_at        (discarded_at)
#  index_customers_on_tenant_id           (tenant_id)
#  index_customers_on_tenant_id_and_name  (tenant_id,name)
#
# Foreign Keys
#
#  fk_rails_...  (tenant_id => tenants.id)
#
FactoryBot.define do
  factory :customer do
    tenant
    sequence(:name) { |n| "テスト顧客#{n}" }
    customer_type { "corporate" }
    rate_percent { 100 }

    trait :individual do
      customer_type { "individual" }
    end

    trait :corporate do
      customer_type { "corporate" }
      sequence(:corporation_number) { |n| format("%013d", n) }
    end

    trait :discarded do
      discarded_at { Time.current }
    end
  end
end
