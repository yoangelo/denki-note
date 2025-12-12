# == Schema Information
#
# Table name: materials
#
#  id                                    :uuid             not null, primary key
#  discarded_at(削除日時（論理削除）)    :datetime
#  material_type(資材タイプ（自由入力）) :string
#  model_number(型番)                    :string
#  name(名称)                            :string           not null
#  unit(単位)                            :string
#  unit_price(単価)                      :decimal(12, )    default(0), not null
#  created_at                            :datetime         not null
#  updated_at                            :datetime         not null
#  tenant_id(自社ID)                     :uuid             not null
#
# Indexes
#
#  index_materials_on_discarded_at        (discarded_at)
#  index_materials_on_model_number        (model_number)
#  index_materials_on_tenant_id           (tenant_id)
#  index_materials_on_tenant_id_and_name  (tenant_id,name)
#
# Foreign Keys
#
#  fk_rails_...  (tenant_id => tenants.id)
#
class Material < ApplicationRecord
  include Discard::Model

  belongs_to :tenant
  has_many :daily_report_materials, dependent: :destroy
  has_many :daily_reports, through: :daily_report_materials
  has_many :invoice_items, foreign_key: :source_material_id, inverse_of: :source_material, dependent: :nullify

  validates :name, presence: { message: "資材名を入力してください" }
  validates :unit_price, presence: { message: "単価を入力してください" },
                         numericality: { greater_than_or_equal_to: 0, message: "単価は0以上で入力してください" }

  scope :search_by_name, ->(query) { where("name ILIKE ?", "%#{query}%") if query.present? }
  scope :search_by_model_number, ->(query) { where("model_number ILIKE ?", "%#{query}%") if query.present? }
  scope :filter_by_type, ->(type) { where(material_type: type) if type.present? }
end
