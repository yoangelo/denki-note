# == Schema Information
#
# Table name: invoices
#
#  id                                                              :uuid             not null, primary key
#  billing_date                                                    :date             not null
#  created_by(作成者ID)                                            :uuid
#  customer_name(顧客名（コピー値、手動編集可）)                   :string           not null
#  delivery_date(受渡期日)                                         :date
#  delivery_place(受渡場所)                                        :string
#  discarded_at(削除日時（論理削除）)                              :datetime
#  invoice_number(請求書番号（自社内でユニーク、draftではNULL可）) :string
#  issued_at(発行日時)                                             :datetime
#  note(備考)                                                      :text
#  status(ステータス（draft/issued/canceled）)                     :string           default("draft"), not null
#  subtotal(税抜合計金額)                                          :decimal(12, )    default(0), not null
#  tax_amount(消費税額)                                            :decimal(12, )    default(0), not null
#  tax_rate(適用税率（%）)                                         :decimal(4, 2)    default(10.0), not null
#  title(タイトル)                                                 :string
#  total_amount(税込合計金額)                                      :decimal(12, )    default(0), not null
#  transaction_method(取引方法)                                    :string
#  valid_until(有効期限)                                           :date
#  created_at                                                      :datetime         not null
#  updated_at                                                      :datetime         not null
#  customer_id(顧客ID)                                             :uuid             not null
#  site_id(現場ID)                                                 :uuid
#  tenant_id(自社ID)                                               :uuid             not null
#
# Indexes
#
#  index_invoices_on_customer_id                   (customer_id)
#  index_invoices_on_discarded_at                  (discarded_at)
#  index_invoices_on_site_id                       (site_id)
#  index_invoices_on_status                        (status)
#  index_invoices_on_tenant_id                     (tenant_id)
#  index_invoices_on_tenant_id_and_invoice_number  (tenant_id,invoice_number) UNIQUE WHERE (invoice_number IS NOT NULL)
#
# Foreign Keys
#
#  fk_rails_...  (created_by => users.id)
#  fk_rails_...  (customer_id => customers.id)
#  fk_rails_...  (site_id => sites.id)
#  fk_rails_...  (tenant_id => tenants.id)
#
FactoryBot.define do
  factory :invoice do
    tenant
    customer
    billing_date { Date.current }
    status { "draft" }
    tax_rate { 10.0 }

    after(:build) do |invoice|
      invoice.customer_name ||= invoice.customer&.name
    end

    trait :with_site do
      site
    end

    trait :issued do
      status { "issued" }
      sequence(:invoice_number) { |n| "INV-#{Time.current.year}-#{format("%03d", n)}" }
      issued_at { Time.current }
    end

    trait :canceled do
      status { "canceled" }
      sequence(:invoice_number) { |n| "INV-#{Time.current.year}-#{format("%03d", n)}" }
      issued_at { Time.current }
    end

    trait :discarded do
      discarded_at { Time.current }
    end
  end
end
