class DailyReportsController < AuthenticatedController
  before_action :require_admin, only: [:bulk_update, :destroy]

  def index
    return render json: { daily_reports: [], meta: { total_count: 0, returned_count: 0, year_month: params[:year_month] || "" } } unless current_tenant

    # クエリパラメータの処理
    scope = DailyReport.kept
                       .where(sites: { tenant: current_tenant })
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


  def show
    daily_report = DailyReport.kept
                               .where(sites: { tenant: current_tenant })
                               .joins(:site)
                               .includes(:site => :customer, :work_entries => :user)
                               .find_by(id: params[:id])

    return render json: { error: '日報が見つかりません' }, status: :not_found unless daily_report

    render json: {
      daily_report: format_daily_report(daily_report)
    }
  end

  def bulk_create
    reports_created = 0
    entries_created = 0
    created_reports = []
    errors = []

    return render json: { success: false, errors: [{ error: "Tenant not found" }] }, status: :unauthorized unless current_tenant

    ActiveRecord::Base.transaction do
      bulk_create_params[:daily_reports].each_with_index do |report_params, index|
        # work_entriesにtenant_idを追加
        work_entries_attrs = report_params[:work_entries].map do |entry_params|
          {
            tenant_id: current_tenant.id,
            user_id: entry_params[:user_id],
            minutes: entry_params[:minutes],
            summary: nil # work_entriesのsummaryは使用しない
          }
        end

        # 日報とwork_entriesを同時に作成
        daily_report = DailyReport.new(
          tenant_id: current_tenant.id,
          site_id: report_params[:site_id],
          work_date: report_params[:work_date],
          summary: report_params[:summary],
          created_by: current_user.id,
          work_entries_attributes: work_entries_attrs
        )

        if daily_report.save
          reports_created += 1
          entries_count = daily_report.work_entries.count
          entries_created += entries_count

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

  def bulk_update
    daily_report = DailyReport.kept
                               .where(sites: { tenant: current_tenant })
                               .joins(:site)
                               .find_by(id: params[:id])

    return render json: { error: '日報が見つかりません' }, status: :not_found unless daily_report

    ActiveRecord::Base.transaction do
      # 日報ヘッダの更新
      daily_report.update!(
        site_id: bulk_update_params[:site_id],
        summary: bulk_update_params[:summary]
      )

      # 既存のwork_entriesを全削除
      daily_report.work_entries.destroy_all

      # 新しいwork_entriesを一括作成
      bulk_update_params[:work_entries].each do |entry_params|
        daily_report.work_entries.create!(
          tenant_id: current_tenant.id,
          user_id: entry_params[:user_id],
          minutes: entry_params[:minutes]
        )
      end

      # 最新データを再読み込み
      daily_report.reload
      daily_report.site.reload
    end

    render json: {
      success: true,
      daily_report: format_daily_report(daily_report)
    }
  rescue ActiveRecord::RecordInvalid => e
    render json: {
      errors: e.record.errors.messages
    }, status: :unprocessable_entity
  rescue => e
    render json: {
      error: e.message
    }, status: :unprocessable_entity
  end

  def destroy
    daily_report = DailyReport.kept
                               .where(sites: { tenant: current_tenant })
                               .joins(:site)
                               .find_by(id: params[:id])

    return render json: { error: '日報が見つかりません' }, status: :not_found unless daily_report

    daily_report.discard

    head :no_content
  end

  private

  def require_admin
    unless current_user&.admin?
      render json: { error: 'この操作を実行する権限がありません' }, status: :forbidden
    end
  end

  def format_daily_report(report)
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

  def bulk_create_params
    params.permit(
      daily_reports: [
        :site_id,
        :work_date,
        :summary,
        work_entries: [:user_id, :minutes]
      ]
    )
  end

  def bulk_update_params
    params.require(:daily_report).permit(
      :site_id,
      :summary,
      work_entries: [:user_id, :minutes]
    )
  end
end