class DailyReportMaterial < ApplicationRecord
  belongs_to :daily_report
  belongs_to :material

  validates :daily_report_id, uniqueness: { scope: :material_id, message: "この資材は既に追加されています" }
  validates :quantity, presence: { message: "数量を入力してください" },
                       numericality: { greater_than: 0, message: "数量は0より大きい値を入力してください" }
end
