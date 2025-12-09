# 顧客情報を管理するコントローラー
class CustomersController < AuthenticatedController
  # 顧客一覧を取得する
  #
  # クエリパラメータで名前検索が可能。結果は名前順でソートされる。
  #
  # @return [Array<Hash>] 顧客情報の配列（id, name, customer_type, corporation_number, rate_percent）
  def index
    return render json: [] unless current_tenant

    scope = Customer.kept.where(tenant: current_tenant)
    scope = scope.search_by_name(index_params[:query]) if index_params[:query].present?
    limit = (index_params[:limit] || 20).to_i.clamp(1, 50)
    render json: scope.order(:name).limit(limit).select(:id, :name, :customer_type, :corporation_number, :rate_percent)
  end

  # 最近使用した顧客一覧を取得する
  #
  # 直近の日報から最大3件の顧客を取得し、最終利用日時順にソートして返す。
  # 各顧客には最後に使用した現場の情報も含まれる。
  #
  # @return [Array<Hash>] 顧客情報の配列（id, name, customer_type, corporation_number, rate_percent, site, last_used_at）
  def recent
    return render json: [] unless current_tenant

    # 直近の日報10件を取得（削除済みの顧客・現場は除外）
    recent_daily_reports = DailyReport
                           .joins(site: :customer)
                           .where(sites: { tenant: current_tenant, discarded_at: nil })
                           .where(customers: { discarded_at: nil })
                           .order(created_at: :desc)
                           .limit(10)
                           .includes(site: :customer)

    # 日報に紐づく顧客と現場の情報を集計
    customer_site_map = {}

    recent_daily_reports.each do |daily_report|
      site = daily_report.site
      customer = site.customer

      # 各顧客について、最後に使用した現場と使用日時を記録
      unless !customer_site_map[customer.id] || customer_site_map[customer.id][:last_used_at] < daily_report.created_at
        next
      end

      customer_site_map[customer.id] = {
        customer: customer,
        site: site,
        last_used_at: daily_report.created_at,
      }
    end

    # 最大3件の顧客に制限し、最終利用日時順にソート
    result = customer_site_map.values
                              .sort_by { |item| -item[:last_used_at].to_i }
                              .take(3)
                              .map do |item|
      {
        id: item[:customer].id,
        name: item[:customer].name,
        customer_type: item[:customer].customer_type,
        corporation_number: item[:customer].corporation_number,
        rate_percent: item[:customer].rate_percent,
        site: {
          id: item[:site].id,
          name: item[:site].name,
        },
        last_used_at: item[:last_used_at],
      }
    end

    render json: result
  end

  private

  # indexアクション用のパラメータを許可する
  #
  # @return [ActionController::Parameters] 許可されたパラメータ（query, limit）
  def index_params
    params.permit(:query, :limit)
  end
end
