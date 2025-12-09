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

    allowed_sort_columns = ["created_at", "invoice_number", "total_amount", "issued_at", "customer_name"]
    sort_by = "created_at" unless allowed_sort_columns.include?(sort_by)
    sort_order = "desc" unless ["asc", "desc"].include?(sort_order)

    invoices = invoices.order("#{sort_by} #{sort_order}")

    render json: {
      invoices: invoices.as_json(
        only: [
          :id, :invoice_number, :customer_id, :customer_name, :site_id, :site_name,
          :subtotal, :tax_rate, :tax_amount, :total_amount, :status, :issued_at,
          :discarded_at, :created_at, :updated_at,
        ]
      ),
    }
  end

  # GET /admin/invoices/:id
  def show
    daily_reports = @invoice.daily_reports.kept.includes(:site).map do |dr|
      {
        id: dr.id,
        report_date: dr.report_date,
        site_name: dr.site&.name,
        summary: generate_daily_report_summary(dr),
      }
    end

    render json: {
      invoice: @invoice.as_json(
        only: [
          :id, :invoice_number, :customer_id, :customer_name, :site_id, :site_name,
          :title, :subtotal, :tax_rate, :tax_amount, :total_amount, :status,
          :issued_at, :delivery_date, :delivery_place, :transaction_method,
          :valid_until, :note, :created_at, :updated_at,
        ]
      ),
      invoice_items: @invoice.invoice_items.as_json(
        only: [
          :id, :item_type, :name, :quantity, :unit, :unit_price, :amount,
          :sort_order, :source_product_id, :source_material_id,
        ]
      ),
      daily_reports: daily_reports,
    }
  end

  # POST /admin/invoices
  def create
    @invoice = current_tenant.invoices.build(invoice_params)
    @invoice.creator = current_user

    if params[:daily_report_ids].present?
      params[:daily_report_ids].each do |dr_id|
        @invoice.invoice_daily_reports.build(daily_report_id: dr_id)
      end
    end

    if params[:invoice_items].present?
      params[:invoice_items].each_with_index do |item_params, index|
        @invoice.invoice_items.build(
          item_type: item_params[:item_type],
          name: item_params[:name],
          quantity: item_params[:quantity],
          unit: item_params[:unit],
          unit_price: item_params[:unit_price],
          sort_order: item_params[:sort_order] || index,
          source_product_id: item_params[:source_product_id],
          source_material_id: item_params[:source_material_id]
        )
      end
    end

    if @invoice.save
      render json: {
        invoice: invoice_json(@invoice),
        invoice_items: @invoice.invoice_items.as_json(
          only: [:id, :item_type, :name, :quantity, :unit, :unit_price, :amount, :sort_order]
        ),
      }, status: :created
    else
      render json: { errors: @invoice.errors.full_messages }, status: :unprocessable_entity
    end
  end

  # PATCH /admin/invoices/:id
  def update
    return render json: { error: "取消済みの請求書は編集できません" }, status: :unprocessable_entity if @invoice.canceled?

    ActiveRecord::Base.transaction do
      @invoice.assign_attributes(update_invoice_params)

      if params[:invoice_items].present?
        @invoice.invoice_items.destroy_all

        params[:invoice_items].each_with_index do |item_params, index|
          @invoice.invoice_items.build(
            item_type: item_params[:item_type],
            name: item_params[:name],
            quantity: item_params[:quantity],
            unit: item_params[:unit],
            unit_price: item_params[:unit_price],
            sort_order: item_params[:sort_order] || index,
            source_product_id: item_params[:source_product_id],
            source_material_id: item_params[:source_material_id]
          )
        end
      end

      if params[:daily_report_ids].present?
        @invoice.invoice_daily_reports.destroy_all

        params[:daily_report_ids].each do |dr_id|
          @invoice.invoice_daily_reports.build(daily_report_id: dr_id)
        end
      end

      @invoice.save!

      render json: {
        invoice: invoice_json(@invoice.reload),
        invoice_items: @invoice.invoice_items.as_json(
          only: [:id, :item_type, :name, :quantity, :unit, :unit_price, :amount, :sort_order]
        ),
      }
    end
  rescue ActiveRecord::RecordInvalid => e
    render json: { errors: e.record.errors.full_messages }, status: :unprocessable_entity
  end

  # POST /admin/invoices/:id/issue
  def issue
    return render json: { error: "下書き状態の請求書のみ発行できます" }, status: :unprocessable_entity unless @invoice.draft?

    if @invoice.issue
      render json: {
        invoice: invoice_json(@invoice),
      }
    else
      render json: { errors: @invoice.errors.full_messages }, status: :unprocessable_entity
    end
  end

  # POST /admin/invoices/:id/cancel
  def cancel
    return render json: { error: "既に取消済みです" }, status: :unprocessable_entity if @invoice.canceled?

    if @invoice.cancel
      render json: {
        invoice: invoice_json(@invoice),
      }
    else
      render json: { errors: @invoice.errors.full_messages }, status: :unprocessable_entity
    end
  end

  # POST /admin/invoices/:id/copy
  def copy
    new_invoice = @invoice.copy_to_new_invoice
    new_invoice.tenant = current_tenant
    new_invoice.creator = current_user

    if new_invoice.save
      render json: {
        invoice: invoice_json(new_invoice),
        invoice_items: new_invoice.invoice_items.as_json(
          only: [:id, :item_type, :name, :quantity, :unit, :unit_price, :amount, :sort_order]
        ),
      }, status: :created
    else
      render json: { errors: new_invoice.errors.full_messages }, status: :unprocessable_entity
    end
  end

  private

  def set_invoice
    @invoice = current_tenant.invoices.with_discarded.find(params[:id])
  rescue ActiveRecord::RecordNotFound
    render json: { error: "請求書が見つかりません" }, status: :not_found
  end

  def invoice_params
    params.require(:invoice).permit(
      :customer_id, :site_id, :title, :tax_rate, :delivery_date,
      :delivery_place, :transaction_method, :valid_until, :note,
      :customer_name, :site_name
    )
  end

  def update_invoice_params
    return {} unless params[:invoice]

    params.require(:invoice).permit(
      :customer_id, :site_id, :title, :tax_rate, :delivery_date,
      :delivery_place, :transaction_method, :valid_until, :note,
      :customer_name, :site_name
    )
  end

  def invoice_json(invoice)
    invoice.as_json(
      only: [
        :id, :invoice_number, :customer_id, :customer_name, :site_id, :site_name,
        :title, :subtotal, :tax_rate, :tax_amount, :total_amount, :status,
        :issued_at, :delivery_date, :delivery_place, :transaction_method,
        :valid_until, :note, :discarded_at, :created_at, :updated_at,
      ]
    )
  end

  def generate_daily_report_summary(daily_report)
    products = if daily_report.respond_to?(:daily_report_products)
                 daily_report.daily_report_products.includes(:product)
               else
                 []
               end

    materials = if daily_report.respond_to?(:daily_report_materials)
                  daily_report.daily_report_materials.includes(:material)
                else
                  []
                end

    parts = products.map { |drp| "#{drp.product&.name}(#{drp.quantity})" }
    parts += materials.map { |drm| "#{drm.material&.name}(#{drm.quantity})" }

    parts.join("、")
  end

  def require_admin
    return if current_user&.has_role?(:admin)

    render json: { error: "この操作を実行する権限がありません" }, status: :forbidden
  end
end
