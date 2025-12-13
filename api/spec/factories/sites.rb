# == Schema Information
#
# Table name: sites
#
#  id(ID)                             :uuid             not null, primary key
#  address                            :string
#  discarded_at(削除日時（論理削除）) :datetime
#  name(現場名)                       :string           not null
#  created_at(作成日時)               :datetime         not null
#  updated_at(更新日時)               :datetime         not null
#  customer_id(顧客ID)                :uuid             not null
#  tenant_id(自社ID)                  :uuid             not null
#
# Indexes
#
#  index_sites_on_customer_id                         (customer_id)
#  index_sites_on_discarded_at                        (discarded_at)
#  index_sites_on_tenant_id                           (tenant_id)
#  index_sites_on_tenant_id_and_customer_id_and_name  (tenant_id,customer_id,name) UNIQUE
#
# Foreign Keys
#
#  fk_rails_...  (customer_id => customers.id)
#  fk_rails_...  (tenant_id => tenants.id)
#
FactoryBot.define do
  factory :site do
    tenant
    customer
    sequence(:name) { |n| "テスト現場#{n}" }
    address { nil }

    trait :discarded do
      discarded_at { Time.current }
    end
  end
end
