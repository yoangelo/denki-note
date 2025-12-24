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
  #   - labor_cost_jpy [Integer] 工賃合計（円）
  #   - product_amount_jpy [Integer] 製品金額合計（円）
  #   - material_amount_jpy [Integer] 資材金額合計（円）
  #   - total_amount_jpy [Integer] 請求金額合計（円）
  def customer_month
    empty_response = {
      rows: [],
      total_hours: 0,
      labor_cost_jpy: 0,
      product_amount_jpy: 0,
      material_amount_jpy: 0,
      total_amount_jpy: 0,
    }
    return render json: empty_response unless current_tenant

    begin
      month_date = Date.strptime("#{summary_params[:yyyymm]}-01", "%Y-%m-%d")
    rescue StandardError
      return render json: { error: "Invalid date format" }, status: :bad_request
    end

    month_range = month_date..month_date.end_of_month

    # 顧客に紐づく現場のIDを取得
    site_ids = Site.where(tenant: current_tenant, customer_id: summary_params[:customer_id]).pluck(:id)

    # 現場に紐づく日報を取得（論理削除されていないもののみ）
    reports = DailyReport.kept.where(tenant: current_tenant, site_id: site_ids, work_date: month_range)
                         .includes(:daily_report_products, :daily_report_materials,
                                   daily_report_products: :product,
                                   daily_report_materials: :material)
    report_map = reports.index_by(&:id)

    # 作業エントリを集計
    entries = WorkEntry.where(tenant: current_tenant, daily_report_id: reports.pluck(:id))
                       .includes(:daily_report, :user)

    # 日付ごとに集計
    rows = []
    entries.group_by { |e| report_map[e.daily_report_id]&.work_date }.each do |date, date_entries|
      next unless date

      total_minutes = date_entries.sum(&:minutes)
      summaries = date_entries.filter_map(&:summary).reject(&:empty?).join(", ")
      rows << {
        date: date.to_s,
        summary: summaries[0..200],
        hours: (total_minutes / 60.0).round(2),
      }
    end
    rows.sort_by! { |r| r[:date] }

    total_hours = rows.sum { |r| r[:hours] }.round(2)

    # 工賃計算（日報に保存されているlabor_costを合計）
    labor_cost_jpy = reports.sum(&:labor_cost).to_i

    # 製品金額計算
    product_amount_jpy = reports.sum do |report|
      report.daily_report_products.sum do |drp|
        (drp.quantity * drp.product.unit_price).to_i
      end
    end

    # 資材金額計算
    material_amount_jpy = reports.sum do |report|
      report.daily_report_materials.sum do |drm|
        (drm.quantity * drm.material.unit_price).to_i
      end
    end

    # 合計金額
    total_amount_jpy = labor_cost_jpy + product_amount_jpy + material_amount_jpy

    render json: {
      rows: rows,
      total_hours: total_hours,
      labor_cost_jpy: labor_cost_jpy,
      product_amount_jpy: product_amount_jpy,
      material_amount_jpy: material_amount_jpy,
      total_amount_jpy: total_amount_jpy,
    }
  end

  private

  # customer_monthアクション用のパラメータを許可する
  #
  # @return [ActionController::Parameters] 許可されたパラメータ（customer_id, yyyymm）
  def summary_params
    params.permit(:customer_id, :yyyymm)
  end
end
