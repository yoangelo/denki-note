class DailyReportsController < ApplicationController
  def index
    # MVPではテナントIDを固定
    tenant = Tenant.first
    return render json: [] unless tenant

    scope = DailyReport.where(tenant: tenant).includes(:site)
    scope = scope.where(work_date: params[:date]) if params[:date].present?
    scope = scope.where(site_id: params[:site_id]) if params[:site_id].present?

    render json: scope.order(work_date: :desc).limit(100)
  end

  def create
    # MVPではテナントIDを固定
    tenant = Tenant.first
    return render json: { error: "Tenant not found" }, status: :unprocessable_entity unless tenant

    daily_report = DailyReport.new(daily_report_params.merge(tenant: tenant))

    if daily_report.save
      render json: daily_report, status: :created
    else
      render json: { error: daily_report.errors.full_messages.to_sentence }, status: :unprocessable_entity
    end
  end

  private

  def daily_report_params
    params.require(:daily_report).permit(:site_id, :work_date, :created_by)
  end
end