# 日報を管理するコントローラー
class DailyReportsController < AuthenticatedController
  before_action :require_admin, only: [:bulk_update, :destroy]

  # 日報一覧を取得する
  #
  # year_month, user_id, customer_id, site_id でフィルタリング可能。
  # 結果は作業日の降順でソートされる。
  #
  # @return [Hash] 日報一覧とメタ情報
  #   - daily_reports [Array<Hash>] 日報データの配列
  #   - meta [Hash] 総件数、返却件数、検索年月
  def index
    unless current_tenant
      return render json: { daily_reports: [],
                            meta: { total_count: 0, returned_count: 0,
                                    year_month: params[:year_month] || "", }, }
    end

    # クエリパラメータの処理
    scope = DailyReport.kept
                       .where(sites: { tenant: current_tenant })
                       .joins(:site)
                       .includes(site: :customer, work_entries: :user)

    # year_month フィルタ (YYYY-MM形式)
    if params[:year_month].present?
      year, month = params[:year_month].split("-").map(&:to_i)
      start_date = Date.new(year, month, 1)
      end_date = start_date.end_of_month
      scope = scope.where(work_date: start_date..end_date)
    end

    # user_id フィルタ
    scope = scope.joins(:work_entries).where(work_entries: { user_id: params[:user_id] }) if params[:user_id].present?

    # customer_id フィルタ
    if params[:customer_id].present?
      scope = scope.joins(site: :customer).where(sites: { customer_id: params[:customer_id] })
    end

    # site_id フィルタ
    scope = scope.where(site_id: params[:site_id]) if params[:site_id].present?

    # 取得件数の制限
    limit = (params[:limit] || 100).to_i.clamp(1, 500)

    # 総件数を取得
    total_count = scope.distinct.count

    # データを取得
    daily_reports = scope.distinct.order(work_date: :desc).limit(limit)

    # レスポンス形式にフォーマット
    formatted_reports = daily_reports.map { |report| format_daily_report_summary(report) }

    render json: {
      daily_reports: formatted_reports,
      meta: {
        total_count: total_count,
        returned_count: formatted_reports.size,
        year_month: params[:year_month] || "",
      },
    }
  end

  # 日報の詳細を取得する
  #
  # @return [Hash] 日報の詳細情報（daily_report）
  def show
    daily_report = DailyReport.kept.where(sites: { tenant: current_tenant }).joins(:site)
                              .includes(site: :customer, work_entries: :user,
                                        daily_report_products: :product, daily_report_materials: :material)
                              .find_by(id: params[:id])

    return render json: { error: "日報が見つかりません" }, status: :not_found unless daily_report

    render json: {
      daily_report: format_daily_report(daily_report),
    }
  end

  # 日報を一括作成する
  #
  # 複数の日報とそれに紐づく作業エントリを一度に作成する。
  # トランザクション内で処理され、1件でもエラーがあれば全てロールバックされる。
  #
  # @return [Hash] 作成結果
  #   - success [Boolean] 成功/失敗
  #   - summary [Hash] 作成件数（reports_created, entries_created）
  #   - reports [Array<Hash>] 作成された日報の情報
  #   - errors [Array<Hash>] エラー情報
  def bulk_create
    reports_created = 0
    entries_created = 0
    created_reports = []
    errors = []

    unless current_tenant
      return render json: { success: false, errors: [{ error: "Tenant not found" }] },
                    status: :unauthorized
    end

    ActiveRecord::Base.transaction do
      bulk_create_params[:daily_reports].each_with_index do |report_params, index|
        # work_entriesにtenant_idを追加
        work_entries_attrs = report_params[:work_entries].map do |entry_params|
          {
            tenant_id: current_tenant.id,
            user_id: entry_params[:user_id],
            minutes: entry_params[:minutes],
            summary: nil, # work_entriesのsummaryは使用しない
          }
        end

        # 製品データの準備
        products_attrs = (report_params[:products] || []).map do |product_params|
          {
            product_id: product_params[:product_id],
            quantity: product_params[:quantity],
          }
        end

        # 資材データの準備
        materials_attrs = (report_params[:materials] || []).map do |material_params|
          {
            material_id: material_params[:material_id],
            quantity: material_params[:quantity],
          }
        end

        # 日報とwork_entries、products、materialsを同時に作成
        daily_report = DailyReport.new(
          tenant_id: current_tenant.id,
          site_id: report_params[:site_id],
          work_date: report_params[:work_date],
          summary: report_params[:summary],
          created_by: current_user.id,
          work_entries_attributes: work_entries_attrs,
          daily_report_products_attributes: products_attrs,
          daily_report_materials_attributes: materials_attrs
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
            entries_count: entries_count,
          }
        else
          errors << {
            report_index: index,
            site_id: report_params[:site_id],
            error: daily_report.errors.full_messages.join(", "),
          }
          raise ActiveRecord::Rollback
        end
      end
    end

    render json: {
      success: errors.empty?,
      summary: {
        reports_created: reports_created,
        entries_created: entries_created,
      },
      reports: created_reports,
      errors: errors,
    }
  rescue StandardError => e
    render json: {
      success: false,
      summary: {
        reports_created: 0,
        entries_created: 0,
      },
      reports: [],
      errors: [{ error: e.message }],
    }, status: :unprocessable_entity
  end

  # 日報を更新する（管理者専用）
  #
  # 日報ヘッダと作業エントリを一括で更新する。
  # 既存の作業エントリは全て削除され、新しいエントリで置き換えられる。
  #
  # @return [Hash] 更新結果
  #   - success [Boolean] 成功/失敗
  #   - daily_report [Hash] 更新後の日報データ
  def bulk_update
    daily_report = DailyReport.kept
                              .where(sites: { tenant: current_tenant })
                              .joins(:site)
                              .find_by(id: params[:id])

    return render json: { error: "日報が見つかりません" }, status: :not_found unless daily_report

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

      # 既存の製品・資材を全削除
      daily_report.daily_report_products.destroy_all
      daily_report.daily_report_materials.destroy_all

      # 新しい製品を一括作成
      (bulk_update_params[:products] || []).each do |product_params|
        daily_report.daily_report_products.create!(
          product_id: product_params[:product_id],
          quantity: product_params[:quantity]
        )
      end

      # 新しい資材を一括作成
      (bulk_update_params[:materials] || []).each do |material_params|
        daily_report.daily_report_materials.create!(
          material_id: material_params[:material_id],
          quantity: material_params[:quantity]
        )
      end

      # 最新データを再読み込み
      daily_report.reload
      daily_report.site.reload
    end

    render json: {
      success: true,
      daily_report: format_daily_report(daily_report),
    }
  rescue ActiveRecord::RecordInvalid => e
    render json: {
      errors: e.record.errors.messages,
    }, status: :unprocessable_entity
  rescue StandardError => e
    render json: {
      error: e.message,
    }, status: :unprocessable_entity
  end

  # 日報を論理削除する（管理者専用）
  #
  # discardによる論理削除を行う。
  #
  # @return [void] 成功時は204 No Contentを返す
  def destroy
    daily_report = DailyReport.kept
                              .where(sites: { tenant: current_tenant })
                              .joins(:site)
                              .find_by(id: params[:id])

    return render json: { error: "日報が見つかりません" }, status: :not_found unless daily_report

    daily_report.discard

    head :no_content
  end

  private

  # 管理者権限を要求する
  #
  # 管理者でない場合は403 Forbiddenを返す。
  #
  # @return [void]
  def require_admin
    return if current_user&.admin?

    render json: { error: "この操作を実行する権限がありません" }, status: :forbidden
  end

  def format_daily_report_summary(report)
    {
      id: report.id,
      work_date: report.work_date.to_s,
      customer: { id: report.site.customer.id, name: report.site.customer.name },
      site: { id: report.site.id, name: report.site.name },
      summary: report.summary || "",
      work_entries: format_work_entries(report.work_entries),
      total_minutes: report.work_entries.sum(:minutes),
      labor_cost: report.labor_cost.to_i,
      created_at: report.created_at.iso8601,
      updated_at: report.updated_at.iso8601,
    }
  end

  def format_daily_report(report)
    format_daily_report_summary(report).merge(
      products: format_products(report.daily_report_products),
      materials: format_materials(report.daily_report_materials)
    )
  end

  def format_work_entries(entries)
    entries.map { |e| { id: e.id, user: { id: e.user.id, display_name: e.user.display_name }, minutes: e.minutes } }
  end

  def format_products(daily_report_products)
    daily_report_products.map do |drp|
      { id: drp.id, product_id: drp.product_id, name: drp.product.name,
        quantity: drp.quantity.to_f, unit: drp.product.unit, unit_price: drp.product.unit_price.to_f, }
    end
  end

  def format_materials(daily_report_materials)
    daily_report_materials.map do |drm|
      { id: drm.id, material_id: drm.material_id, name: drm.material.name,
        quantity: drm.quantity.to_f, unit: drm.material.unit, unit_price: drm.material.unit_price.to_f, }
    end
  end

  # bulk_createアクション用のパラメータを許可する
  #
  # @return [ActionController::Parameters] 許可されたパラメータ
  def bulk_create_params
    params.permit(
      daily_reports: [
        :site_id,
        :work_date,
        :summary,
        { work_entries: [:user_id, :minutes] },
        { products: [:product_id, :quantity] },
        { materials: [:material_id, :quantity] },
      ]
    )
  end

  # bulk_updateアクション用のパラメータを許可する
  #
  # @return [ActionController::Parameters] 許可されたパラメータ
  def bulk_update_params
    params.require(:daily_report).permit(
      :site_id,
      :summary,
      work_entries: [:user_id, :minutes],
      products: [:product_id, :quantity],
      materials: [:material_id, :quantity]
    )
  end
end
