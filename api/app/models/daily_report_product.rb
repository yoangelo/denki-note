class DailyReportProduct < ApplicationRecord
  belongs_to :daily_report
  belongs_to :product

  validates :daily_report_id, uniqueness: { scope: :product_id, message: "この製品は既に追加されています" }
  validates :quantity, presence: { message: "数量を入力してください" },
    numericality: { greater_than: 0, message: "数量は0より大きい値を入力してください" }
end
