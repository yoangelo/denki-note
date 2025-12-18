class Admin::InvoicesController < AuthenticatedController
  before_action :require_admin
  before_action :set_invoice, only: [:show, :update, :issue, :cancel, :copy]

  # GET /admin/invoices
  def index
    invoices = current_tenant.invoices

    invoices = params[:show_discarded] == "true" ? invoices.with_discarded : invoices.kept

    invoices = invoices.filter_by_customer(params[:customer_id])
    invoices = invoices.filter_by_site(params[:site_id])
    invoices = invoices.filter_by_status(params[:status])
    invoices = invoices.filter_by_issued_date_range(params[:issued_from], params[:issued_to])

    sort_by = params[:sort_by].presence || "created_at"
    sort_order = params[:sort_order].presence || "desc"
    allowed_sort_columns = ["invoice_number", "title", "customer_name", "total_amount", "billing_date", "issued_at",
                            "created_at",]
    sort_by = "created_at" unless allowed_sort_columns.include?(sort_by)
    sort_order = "desc" unless ["asc", "desc"].include?(sort_order)

    invoices = invoices.order("#{sort_by} #{sort_order}")

    page = (params[:page] || 1).to_i
    per_page = (params[:per_page] || 20).to_i
    per_page = [per_page, 100].min

    total_count = invoices.count
    total_pages = (total_count.to_f / per_page).ceil

    invoices = invoices.includes(:site)
                       .offset((page - 1) * per_page)
                       .limit(per_page)

    render json: {
      invoices: invoices.map { |i| invoice_list_json(i) },
      meta: {
        total_count: total_count,
        total_pages: total_pages,
        current_page: page,
        per_page: per_page,
      },
    }
  end

  # GET /admin/invoices/:id
  def show
    render json: invoice_detail_json(@invoice)
  end

  # POST /admin/invoices
  def create
    @invoice = current_tenant.invoices.build(invoice_params)
    @invoice.created_by = current_user.id

    ActiveRecord::Base.transaction do
      @invoice.save!

      create_invoice_items(params[:invoice_items]) if params[:invoice_items].present?
      create_invoice_daily_reports(params[:daily_report_ids]) if params[:daily_report_ids].present?

      @invoice.reload
    end

    render json: invoice_detail_json(@invoice), status: :created
  rescue ActiveRecord::RecordInvalid => e
    render json: { errors: e.record.errors.full_messages }, status: :unprocessable_entity
  end

  # PATCH /admin/invoices/:id
  def update
    if @invoice.canceled?
      render json: { error: "取消済みの請求書は編集できません" }, status: :unprocessable_entity
      return
    end

    ActiveRecord::Base.transaction do
      @invoice.update!(invoice_params) if params[:invoice].present?

      update_invoice_items(params[:invoice_items]) if params[:invoice_items].present?

      update_invoice_daily_reports(params[:daily_report_ids]) if params.key?(:daily_report_ids)

      @invoice.reload
    end

    render json: invoice_detail_json(@invoice)
  rescue ActiveRecord::RecordInvalid => e
    render json: { errors: e.record.errors.full_messages }, status: :unprocessable_entity
  end

  # POST /admin/invoices/:id/issue
  def issue
    if @invoice.issue
      render json: {
        invoice: {
          id: @invoice.id,
          invoice_number: @invoice.invoice_number,
          status: @invoice.status,
          issued_at: @invoice.issued_at,
        },
      }
    else
      errors = @invoice.errors.full_messages
      errors = ["下書きの請求書のみ発行できます"] if errors.empty? && !@invoice.draft?
      render json: { errors: errors }, status: :unprocessable_entity
    end
  end

  # POST /admin/invoices/:id/cancel
  def cancel
    if @invoice.cancel
      render json: {
        invoice: {
          id: @invoice.id,
          invoice_number: @invoice.invoice_number,
          status: @invoice.status,
        },
      }
    else
      errors = @invoice.errors.full_messages
      errors = ["既に取消済みの請求書です"] if errors.empty? && @invoice.canceled?
      render json: { errors: errors }, status: :unprocessable_entity
    end
  end

  # POST /admin/invoices/:id/copy
  def copy
    new_invoice = @invoice.copy_to_new_invoice
    new_invoice.tenant = current_tenant
    new_invoice.created_by = current_user.id

    if new_invoice.save
      render json: invoice_detail_json(new_invoice), status: :created
    else
      render json: { errors: new_invoice.errors.full_messages }, status: :unprocessable_entity
    end
  end

  private

  def set_invoice
    @invoice = current_tenant.invoices.kept.find(params[:id])
  rescue ActiveRecord::RecordNotFound
    render json: { error: "請求書が見つかりません" }, status: :not_found
  end

  def invoice_params
    params.require(:invoice).permit(
      :customer_id, :site_id, :billing_date, :customer_name, :title, :tax_rate,
      :delivery_date, :delivery_place, :transaction_method, :valid_until, :note
    )
  end

  def create_invoice_items(items_params)
    items_params.each do |item_params|
      @invoice.invoice_items.create!(invoice_item_params(item_params))
    end
  end

  def update_invoice_items(items_params)
    existing_ids = items_params.filter_map { |p| p[:id] }
    @invoice.invoice_items.where.not(id: existing_ids).destroy_all

    items_params.each do |item_params|
      if item_params[:id].present?
        item = @invoice.invoice_items.find(item_params[:id])
        item.update!(invoice_item_params(item_params))
      else
        @invoice.invoice_items.create!(invoice_item_params(item_params))
      end
    end
  end

  def invoice_item_params(params)
    params.permit(
      :item_type, :name, :quantity, :unit, :unit_price, :amount, :sort_order, :note,
      :source_product_id, :source_material_id
    )
  end

  def create_invoice_daily_reports(daily_report_ids)
    daily_report_ids.each do |dr_id|
      @invoice.invoice_daily_reports.create!(daily_report_id: dr_id)
    end
  end

  def update_invoice_daily_reports(daily_report_ids)
    @invoice.invoice_daily_reports.destroy_all
    daily_report_ids&.each do |dr_id|
      @invoice.invoice_daily_reports.create!(daily_report_id: dr_id)
    end
  end

  def invoice_list_json(invoice)
    {
      id: invoice.id,
      invoice_number: invoice.invoice_number,
      title: invoice.title,
      customer_id: invoice.customer_id,
      customer_name: invoice.customer_name,
      site_id: invoice.site_id,
      site_name: invoice.site&.name,
      billing_date: invoice.billing_date,
      total_amount: invoice.total_amount,
      status: invoice.status,
      issued_at: invoice.issued_at,
      created_at: invoice.created_at,
    }
  end

  def invoice_detail_json(invoice)
    bank_account = current_tenant.bank_accounts.kept.default_for_invoice.first

    {
      invoice: {
        id: invoice.id,
        invoice_number: invoice.invoice_number,
        billing_date: invoice.billing_date,
        customer_id: invoice.customer_id,
        customer_name: invoice.customer_name,
        site_id: invoice.site_id,
        site_name: invoice.site&.name,
        title: invoice.title,
        subtotal: invoice.subtotal.to_f,
        tax_rate: invoice.tax_rate.to_f,
        tax_amount: invoice.tax_amount.to_f,
        total_amount: invoice.total_amount.to_f,
        status: invoice.status,
        issued_at: invoice.issued_at,
        delivery_date: invoice.delivery_date,
        delivery_place: invoice.delivery_place,
        transaction_method: invoice.transaction_method,
        valid_until: invoice.valid_until,
        note: invoice.note,
        created_at: invoice.created_at,
        updated_at: invoice.updated_at,
      },
      invoice_items: invoice.invoice_items.map { |item| invoice_item_json(item) },
      daily_reports: invoice.daily_reports.kept.map { |dr| daily_report_json(dr) },
      bank_account: bank_account ? bank_account_json(bank_account) : nil,
    }
  end

  def invoice_item_json(item)
    {
      id: item.id,
      item_type: item.item_type,
      name: item.name,
      quantity: item.quantity&.to_f,
      unit: item.unit,
      unit_price: item.unit_price&.to_f,
      amount: item.amount&.to_f,
      sort_order: item.sort_order,
      note: item.note,
      source_product_id: item.source_product_id,
      source_material_id: item.source_material_id,
    }
  end

  def daily_report_json(daily_report)
    {
      id: daily_report.id,
      work_date: daily_report.work_date,
      site_name: daily_report.site&.name,
      summary: daily_report.summary,
      labor_cost: daily_report.labor_cost&.to_i,
    }
  end

  def bank_account_json(bank_account)
    {
      id: bank_account.id,
      bank_name: bank_account.bank_name,
      branch_name: bank_account.branch_name,
      account_type: bank_account.account_type,
      account_type_label: Admin::BankAccountsController::ACCOUNT_TYPE_LABELS[bank_account.account_type],
      account_number_masked: bank_account.masked_account_number,
      account_holder: bank_account.account_holder,
    }
  end

  def require_admin
    return if current_user&.has_role?(:admin)

    render json: { error: "この操作を実行する権限がありません" }, status: :forbidden
  end
end
