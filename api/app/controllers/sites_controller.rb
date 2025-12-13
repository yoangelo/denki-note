class SitesController < AuthenticatedController
  def index
    customer_id = params.require(:customer_id)
    q = params[:query].to_s.strip

    return render json: [] unless current_tenant

    scope = Site.kept.where(tenant: current_tenant, customer_id: customer_id)
    scope = scope.where("name ILIKE ?", "%#{q}%") if q.present?
    render json: scope.order(:name).select(:id, :name, :address, :customer_id)
  end

  def create
    return render json: { error: "Tenant not found" }, status: :unprocessable_entity unless current_tenant

    site = Site.new(site_params.merge(tenant: current_tenant))
    if site.save
      render json: site.slice(:id, :name, :address, :customer_id), status: :created
    else
      render json: { error: site.errors.full_messages.to_sentence }, status: :unprocessable_entity
    end
  end

  private

  def site_params
    params.require(:site).permit(:customer_id, :name, :address)
  end
end
