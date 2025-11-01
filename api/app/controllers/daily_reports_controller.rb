class DailyReportsController < ApplicationController
  def index
    # MVPではテナントIDを固定
    tenant = Tenant.first
    return render json: { daily_reports: [], meta: { total_count: 0, returned_count: 0, year_month: params[:year_month] || "" } } unless tenant

    # クエリパラメータの処理
    scope = DailyReport.where(sites: { tenant: tenant })
                       .joins(:site)
                       .includes(:site => :customer, :work_entries => :user)

    # year_month フィルタ (YYYY-MM形式)
    if params[:year_month].present?
      year, month = params[:year_month].split('-').map(&:to_i)
      start_date = Date.new(year, month, 1)
      end_date = start_date.end_of_month
      scope = scope.where(work_date: start_date..end_date)
    end

    # user_id フィルタ
    if params[:user_id].present?
      scope = scope.joins(:work_entries).where(work_entries: { user_id: params[:user_id] })
    end

    # customer_id フィルタ
    if params[:customer_id].present?
      scope = scope.joins(site: :customer).where(sites: { customer_id: params[:customer_id] })
    end

    # site_id フィルタ
    if params[:site_id].present?
      scope = scope.where(site_id: params[:site_id])
    end

    # 取得件数の制限
    limit = (params[:limit] || 100).to_i.clamp(1, 500)
    
    # 総件数を取得
    total_count = scope.distinct.count

    # データを取得
    daily_reports = scope.distinct.order(work_date: :desc).limit(limit)

    # レスポンス形式にフォーマット
    formatted_reports = daily_reports.map do |report|
      {
        id: report.id,
        work_date: report.work_date.to_s,
        customer: {
          id: report.site.customer.id,
          name: report.site.customer.name
        },
        site: {
          id: report.site.id,
          name: report.site.name
        },
        summary: report.summary || "",
        work_entries: report.work_entries.map do |entry|
          {
            id: entry.id,
            user: {
              id: entry.user.id,
              display_name: entry.user.display_name
            },
            minutes: entry.minutes
          }
        end,
        total_minutes: report.work_entries.sum(:minutes),
        created_at: report.created_at.iso8601,
        updated_at: report.updated_at.iso8601
      }
    end

    render json: {
      daily_reports: formatted_reports,
      meta: {
        total_count: total_count,
        returned_count: formatted_reports.size,
        year_month: params[:year_month] || ""
      }
    }
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