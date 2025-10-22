class CustomersController < ApplicationController
  def index
    # MVPではテナントIDを固定（最初のテナント）
    # 後にフロントからテナントの情報を受け取るように変更予定
    tenant = Tenant.first
    return render json: [] unless tenant

    scope = Customer.where(tenant: tenant)
    scope = scope.search_by_name(index_params[:query]) if index_params[:query].present?
    limit = (index_params[:limit] || 20).to_i.clamp(1, 50)
    render json: scope.order(:name).limit(limit).select(:id, :name, :customer_type, :corporation_number, :rate_percent, :unit_rate)
  end

  def create
    # MVPではテナントIDを固定
    tenant = Tenant.first
    return render json: { error: "Tenant not found" }, status: :unprocessable_entity unless tenant

    customer = Customer.new(customer_params.merge(tenant: tenant))

    if customer.save
      render json: customer.slice(:id, :name, :customer_type, :corporation_number, :rate_percent, :unit_rate), status: :created
    else
      render json: { error: customer.errors.full_messages.to_sentence }, status: :unprocessable_entity
    end
  end

  private

  def index_params
    params.permit(:query, :limit)
  end

  def customer_params
    params.require(:customer).permit(:name, :customer_type, :corporation_number, :rate_percent, :unit_rate)
  end
end