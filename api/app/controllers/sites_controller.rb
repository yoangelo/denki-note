class SitesController < ApplicationController
  def index
    customer_id = params.require(:customer_id)
    q = params[:query].to_s.strip

    # MVPではテナントIDを固定
    # 後にフロントからテナントの情報を受け取るように変更予定
    tenant = Tenant.first
    return render json: [] unless tenant

    scope = Site.where(tenant: tenant, customer_id: customer_id)
    scope = scope.where("name ILIKE ?", "%#{q}%") if q.present?
    render json: scope.order(:name).select(:id, :name, :note, :customer_id)
  end

  def create
    # MVPではテナントIDを固定
    # 後にフロントからテナントの情報を受け取るように変更予定
    tenant = Tenant.first
    return render json: { error: "Tenant not found" }, status: :unprocessable_entity unless tenant

    site = Site.new(site_params.merge(tenant: tenant))
    if site.save
      render json: site.slice(:id, :name, :note, :customer_id), status: :created
    else
      render json: { error: site.errors.full_messages.to_sentence }, status: :unprocessable_entity
    end
  end

  private

  def site_params
    params.require(:site).permit(:customer_id, :name, :note)
  end
end