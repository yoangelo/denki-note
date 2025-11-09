class Admin::SitesController < AuthenticatedController
  before_action :require_admin
  before_action :set_site, only: [:update, :destroy]

  # POST /admin/sites
  def create
    customer = current_tenant.customers.kept.find(site_params[:customer_id])

    @site = customer.sites.build(
      tenant: current_tenant,
      name: site_params[:name],
      note: site_params[:note]
    )

    if @site.save
      render json: {
        site: @site.as_json(only: [:id, :customer_id, :tenant_id, :name, :note, :discarded_at, :created_at, :updated_at])
      }, status: :created
    else
      render json: { errors: @site.errors.full_messages }, status: :unprocessable_entity
    end
  rescue ActiveRecord::RecordNotFound
    render json: { error: "顧客が見つかりません" }, status: :not_found
  end

  # PATCH /admin/sites/:id
  def update
    if @site.update(update_params)
      render json: {
        site: @site.as_json(only: [:id, :customer_id, :tenant_id, :name, :note, :discarded_at, :created_at, :updated_at])
      }
    else
      render json: { errors: @site.errors.full_messages }, status: :unprocessable_entity
    end
  end

  # DELETE /admin/sites/:id
  def destroy
    @site.discard
    head :no_content
  end

  private

  def set_site
    @site = current_tenant.sites.kept.find(params[:id])
  rescue ActiveRecord::RecordNotFound
    render json: { error: "現場が見つかりません" }, status: :not_found
  end

  def site_params
    params.require(:site).permit(:customer_id, :name, :note)
  end

  def update_params
    params.require(:site).permit(:name, :note)
  end

  def require_admin
    unless current_user&.has_role?(:admin)
      render json: { error: "この操作を実行する権限がありません" }, status: :forbidden
    end
  end
end
