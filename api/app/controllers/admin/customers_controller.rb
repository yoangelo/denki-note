class Admin::CustomersController < AuthenticatedController
  before_action :require_admin
  before_action :set_customer, only: [:show, :update, :destroy]

  # GET /admin/customers
  def index
    customers = current_tenant.customers
                              .kept
                              .order(created_at: :desc)
                              .select(:id, :name, :customer_type, :corporation_number, :rate_percent, :created_at, :updated_at)

    render json: { customers: customers }
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
    sites = @customer.sites.kept.select(:id, :name, :note, :created_at, :updated_at)

    render json: {
      customer: @customer.as_json(only: [:id, :name, :customer_type, :corporation_number, :rate_percent, :note, :created_at, :updated_at]),
      sites: sites
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
