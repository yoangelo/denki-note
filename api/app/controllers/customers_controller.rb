class CustomersController < AuthenticatedController
  def index
    return render json: [] unless current_tenant

    scope = Customer.where(tenant: current_tenant)
    scope = scope.search_by_name(index_params[:query]) if index_params[:query].present?
    limit = (index_params[:limit] || 20).to_i.clamp(1, 50)
    render json: scope.order(:name).limit(limit).select(:id, :name, :customer_type, :corporation_number, :rate_percent)
  end

  def recent
    return render json: [] unless current_tenant

    # 直近の日報10件を取得
    recent_daily_reports = DailyReport
      .joins(:site)
      .where(sites: { tenant: current_tenant })
      .order(created_at: :desc)
      .limit(10)
      .includes(site: :customer)

    # 日報に紐づく顧客と現場の情報を集計
    customer_site_map = {}
    
    recent_daily_reports.each do |daily_report|
      customer = daily_report.site.customer
      next unless customer
      
      # 各顧客について、最後に使用した現場と使用日時を記録
      if !customer_site_map[customer.id] || customer_site_map[customer.id][:last_used_at] < daily_report.created_at
        customer_site_map[customer.id] = {
          customer: customer,
          site: daily_report.site,
          last_used_at: daily_report.created_at
        }
      end
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
            name: item[:site].name
          },
          last_used_at: item[:last_used_at]
        }
      end

    render json: result
  end

  private

  def index_params
    params.permit(:query, :limit)
  end
end