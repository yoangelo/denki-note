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

  def bulk
    reports_created = 0
    entries_created = 0
    created_reports = []
    errors = []

    ActiveRecord::Base.transaction do
      bulk_params[:daily_reports].each_with_index do |report_params, index|
        # 日報ヘッダの作成
        daily_report = DailyReport.new(
          tenant_id: report_params[:tenant_id],
          site_id: report_params[:site_id],
          work_date: report_params[:work_date],
          summary: report_params[:summary],
          created_by: report_params[:created_by]
        )

        if daily_report.save
          reports_created += 1
          entries_count = 0

          # 作業エントリの作成
          report_params[:work_entries].each do |entry_params|
            work_entry = WorkEntry.new(
              tenant_id: report_params[:tenant_id],
              daily_report_id: daily_report.id,
              user_id: entry_params[:user_id],
              minutes: entry_params[:minutes],
              summary: nil # work_entriesのsummaryは使用しない
            )

            if work_entry.save
              entries_created += 1
              entries_count += 1
            else
              errors << {
                report_index: index,
                site_id: report_params[:site_id],
                error: "Work entry error: #{work_entry.errors.full_messages.join(', ')}"
              }
              raise ActiveRecord::Rollback
            end
          end

          created_reports << {
            id: daily_report.id,
            site_id: daily_report.site_id,
            work_date: daily_report.work_date,
            summary: daily_report.summary,
            entries_count: entries_count
          }
        else
          errors << {
            report_index: index,
            site_id: report_params[:site_id],
            error: daily_report.errors.full_messages.join(', ')
          }
          raise ActiveRecord::Rollback
        end
      end
    end

    render json: {
      success: errors.empty?,
      summary: {
        reports_created: reports_created,
        entries_created: entries_created
      },
      reports: created_reports,
      errors: errors
    }
  rescue => e
    render json: {
      success: false,
      summary: {
        reports_created: 0,
        entries_created: 0
      },
      reports: [],
      errors: [{ error: e.message }]
    }, status: :unprocessable_entity
  end

  private

  def daily_report_params
    params.require(:daily_report).permit(:site_id, :work_date, :created_by, :summary)
  end

  def bulk_params
    params.permit(
      daily_reports: [
        :tenant_id,
        :site_id,
        :work_date,
        :summary,
        :created_by,
        work_entries: [:user_id, :minutes]
      ]
    )
  end
end