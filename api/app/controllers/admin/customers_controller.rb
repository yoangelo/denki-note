class Admin::CustomersController < AuthenticatedController
  before_action :require_admin
  before_action :set_customer, only: [:show, :update, :destroy]

  # GET /admin/customers
  def index
    customers = current_tenant.customers

    # 削除済み表示切り替え
    customers = params[:show_discarded] == "true" ? customers.with_discarded : customers.kept

    # 検索
    customers = customers.search_by_name(params[:search]) if params[:search].present?

    # ソート
    sort_by = params[:sort_by].presence || "created_at"
    sort_order = params[:sort_order].presence || "desc"

    # ソートキーのバリデーション
    allowed_sort_columns = %w[created_at name rate_percent]
    sort_by = "created_at" unless allowed_sort_columns.include?(sort_by)
    sort_order = "desc" unless %w[asc desc].include?(sort_order)

    customers = customers.order("#{sort_by} #{sort_order}")

    render json: {
      customers: customers.as_json(only: [:id, :name, :customer_type, :corporation_number, :rate_percent, :note, :discarded_at, :created_at, :updated_at])
    }
  end

  # GET /admin/customers/check_duplicate
  def check_duplicate
    name = params[:name]
    return render json: { duplicate: false } if name.blank?

    exists = current_tenant.customers.kept.where(name: name).exists?
    render json: { duplicate: exists, name: name }
  end

  # POST /admin/customers_bulk
  def create_bulk
    customer_params_data = params.require(:customer).permit(:name, :customer_type, :corporation_number, :rate_percent, :note)
    sites_params_data = params[:sites] || []

    ActiveRecord::Base.transaction do
      @customer = current_tenant.customers.build(customer_params_data)

      unless @customer.save
        render json: { errors: @customer.errors.full_messages }, status: :unprocessable_entity
        raise ActiveRecord::Rollback
      end

      @sites = []
      sites_params_data.each do |site_data|
        site = @customer.sites.build(
          tenant: current_tenant,
          name: site_data[:name],
          note: site_data[:note]
        )

        unless site.save
          render json: { errors: site.errors.full_messages }, status: :unprocessable_entity
          raise ActiveRecord::Rollback
        end

        @sites << site
      end

      render json: {
        customer: @customer.as_json(only: [:id, :name, :customer_type, :corporation_number, :rate_percent, :note, :created_at, :updated_at]),
        sites: @sites.as_json(only: [:id, :customer_id, :name, :note, :created_at, :updated_at])
      }, status: :created
    end
  end

  # GET /admin/customers/:id
  def show
    # 削除済み現場表示切り替え
    sites = params[:show_discarded] == "true" ? @customer.sites.with_discarded : @customer.sites.kept

    render json: {
      customer: @customer.as_json(only: [:id, :name, :customer_type, :corporation_number, :rate_percent, :note, :created_at, :updated_at]),
      sites: sites.as_json(only: [:id, :customer_id, :name, :note, :discarded_at, :created_at, :updated_at])
    }
  end

  # PATCH /admin/customers/:id
  def update
    if @customer.update(update_params)
      render json: {
        customer: @customer.as_json(only: [:id, :name, :customer_type, :corporation_number, :rate_percent, :note, :created_at, :updated_at])
      }
    else
      render json: { errors: @customer.errors.full_messages }, status: :unprocessable_entity
    end
  end

  # DELETE /admin/customers/:id
  def destroy
    @customer.discard
    head :no_content
  end

  private

  def set_customer
    @customer = current_tenant.customers.kept.find(params[:id])
  rescue ActiveRecord::RecordNotFound
    render json: { error: "顧客が見つかりません" }, status: :not_found
  end

  def update_params
    params.require(:customer).permit(:name, :customer_type, :corporation_number, :rate_percent, :note)
  end

  def require_admin
    unless current_user&.has_role?(:admin)
      render json: { error: "この操作を実行する権限がありません" }, status: :forbidden
    end
  end
end
