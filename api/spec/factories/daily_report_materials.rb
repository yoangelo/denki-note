# == Schema Information
#
# Table name: daily_report_materials
#
#  id                      :uuid             not null, primary key
#  quantity(数量)          :decimal(10, 2)   default(1.0), not null
#  created_at              :datetime         not null
#  updated_at              :datetime         not null
#  daily_report_id(日報ID) :uuid             not null
#  material_id(資材ID)     :uuid             not null
#
# Indexes
#
#  index_daily_report_materials_on_daily_report_id  (daily_report_id)
#  index_daily_report_materials_on_material_id      (material_id)
#  index_daily_report_materials_unique              (daily_report_id,material_id) UNIQUE
#
# Foreign Keys
#
#  fk_rails_...  (daily_report_id => daily_reports.id) ON DELETE => cascade
#  fk_rails_...  (material_id => materials.id)
#
FactoryBot.define do
  factory :daily_report_material do
    daily_report
    material
    quantity { 1 }
  end
end
