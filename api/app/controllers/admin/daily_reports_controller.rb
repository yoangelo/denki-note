class Admin::DailyReportsController < AuthenticatedController
  before_action :require_admin

  # GET /admin/daily_reports/for_invoice
  def for_invoice
    if params[:customer_id].blank?
      render json: { error: "顧客IDは必須です" }, status: :bad_request
      return
    end

    scope = DailyReport.kept
                       .joins(:site)
                       .where(sites: { tenant: current_tenant, customer_id: params[:customer_id] })
                       .includes(:site, :work_entries,
                                 daily_report_products: :product, daily_report_materials: :material)

    scope = scope.where(site_id: params[:site_id]) if params[:site_id].present?
    scope = scope.where(work_date: (params[:from_date])..) if params[:from_date].present?
    scope = scope.where(work_date: ..(params[:to_date])) if params[:to_date].present?

    if params[:exclude_invoice_id].present?
      exclude_dr_ids = InvoiceDailyReport.where(invoice_id: params[:exclude_invoice_id]).pluck(:daily_report_id)
      scope = scope.where.not(id: exclude_dr_ids) if exclude_dr_ids.any?
    end

    page = (params[:page] || 1).to_i
    per_page = (params[:per_page] || 20).to_i
    per_page = [per_page, 100].min

    total_count = scope.count
    total_pages = (total_count.to_f / per_page).ceil

    daily_reports = scope.order(work_date: :desc)
                         .offset((page - 1) * per_page)
                         .limit(per_page)

    render json: {
      daily_reports: daily_reports.map { |dr| format_daily_report_for_invoice(dr) },
      meta: {
        total_count: total_count,
        total_pages: total_pages,
        current_page: page,
      },
    }
  end

  private

  def format_daily_report_for_invoice(report)
    products = report.daily_report_products.map do |drp|
      {
        id: drp.product.id,
        name: drp.product.name,
        quantity: drp.quantity.to_f,
        unit: drp.product.unit,
        unit_price: drp.product.unit_price.to_i,
      }
    end

    materials = report.daily_report_materials.map do |drm|
      {
        id: drm.material.id,
        name: drm.material.name,
        quantity: drm.quantity.to_f,
        unit: drm.material.unit,
        unit_price: drm.material.unit_price.to_i,
      }
    end

    products_total = products.sum { |p| (p[:quantity] * p[:unit_price]).to_i }
    materials_total = materials.sum { |m| (m[:quantity] * m[:unit_price]).to_i }
    total_amount = report.labor_cost.to_i + products_total + materials_total

    {
      id: report.id,
      report_date: report.work_date.to_s,
      site_id: report.site_id,
      site_name: report.site&.name,
      summary: report.summary || "",
      labor_cost: report.labor_cost.to_i,
      products: products,
      materials: materials,
      total_amount: total_amount,
    }
  end

  def require_admin
    return if current_user&.has_role?(:admin)

    render json: { error: "この操作を実行する権限がありません" }, status: :forbidden
  end
end
