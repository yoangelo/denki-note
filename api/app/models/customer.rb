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
#  tenant_id(テナントID)                                         :uuid             not null
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
class Customer < ApplicationRecord
  include Discard::Model

  belongs_to :tenant
  has_many :sites, dependent: :destroy
  has_many :invoices, dependent: :restrict_with_error

  after_discard do
    sites.discard_all
  end

  enum customer_type: {
    corporate: "corporate",
    individual: "individual"
  }

  validates :name, presence: { message: "顧客名を入力してください" }
  validates :customer_type, presence: { message: "企業区分を選択してください" }
  validates :corporation_number,
    numericality: { only_integer: true, message: "法人番号は数字のみ入力してください" },
    allow_blank: true
  validates :rate_percent,
    presence: { message: "掛率を入力してください" },
    numericality: {
      greater_than_or_equal_to: 0,
      less_than_or_equal_to: 300,
      message: "掛率は0〜300の範囲で入力してください"
    }

  validate :warn_duplicate_name

  scope :search_by_name, ->(query) { where("name ILIKE ?", "%#{query}%") if query.present? }

  private

  def warn_duplicate_name
    if Customer.kept
                .where(tenant_id: tenant_id, name: name)
                .where.not(id: id)
                .exists?
      Rails.logger.warn("Duplicate customer name: #{name}")
    end
  end
end
