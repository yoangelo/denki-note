# 集計情報を提供するコントローラー
class SummariesController < AuthenticatedController
  # 顧客の月次サマリーを取得する
  #
  # 指定した顧客の指定月における作業実績を日別に集計し、
  # 合計時間と金額を算出して返す。
  #
  # @return [Hash] 集計結果
  #   - rows [Array<Hash>] 日別の作業データ（date, summary, hours）
  #   - total_hours [Float] 月間合計時間
  #   - amount_jpy [Integer] 請求金額（円）
  def customer_month
    return render json: { rows: [], total_hours: 0, amount_jpy: 0 } unless current_tenant

    begin
      month_date = Date.strptime("#{summary_params[:yyyymm]}-01", "%Y-%m-%d")
    rescue
      return render json: { error: "Invalid date format" }, status: :bad_request
    end

    month_range = month_date..month_date.end_of_month

    # 顧客に紐づく現場のIDを取得
    site_ids = Site.where(tenant: current_tenant, customer_id: summary_params[:customer_id]).pluck(:id)

    # 現場に紐づく日報を取得
    reports = DailyReport.where(tenant: current_tenant, site_id: site_ids, work_date: month_range)
    report_map = reports.index_by(&:id)

    # 作業エントリを集計
    entries = WorkEntry.where(tenant: current_tenant, daily_report_id: reports.pluck(:id))
                       .includes(:daily_report, :user)

    # 日付ごとに集計
    rows = []
    entries.group_by { |e| report_map[e.daily_report_id]&.work_date }.each do |date, date_entries|
      next unless date
      total_minutes = date_entries.sum(&:minutes)
      summaries = date_entries.map(&:summary).compact.reject(&:empty?).join(", ")
      rows << {
        date: date.to_s,
        summary: summaries[0..200],
        hours: (total_minutes / 60.0).round(2)
      }
    end
    rows.sort_by! { |r| r[:date] }

    total_hours = rows.sum { |r| r[:hours] }.round(2)

    # 金額計算
    customer = Customer.find_by(id: summary_params[:customer_id], tenant: current_tenant)
    tenant_setting = TenantSetting.find_by(tenant: current_tenant)

    default_unit_rate = tenant_setting&.default_unit_rate || 0
    rate_percent = (summary_params[:rate_toggle] == "on") ? (customer&.rate_percent || 100) : 100
    amount_jpy = (total_hours * default_unit_rate * (rate_percent / 100.0)).round

    render json: { rows: rows, total_hours: total_hours, amount_jpy: amount_jpy }
  end

  private

  # customer_monthアクション用のパラメータを許可する
  #
  # @return [ActionController::Parameters] 許可されたパラメータ（customer_id, yyyymm, rate_toggle）
  def summary_params
    params.permit(:customer_id, :yyyymm, :rate_toggle)
  end
end