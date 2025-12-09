class Admin::MaterialsController < AuthenticatedController
  before_action :require_admin
  before_action :set_material, only: [:show, :update, :destroy]

  # GET /admin/materials
  def index
    materials = current_tenant.materials

    materials = params[:show_discarded] == "true" ? materials.with_discarded : materials.kept

    materials = materials.search_by_name(params[:search]) if params[:search].present?
    materials = materials.search_by_model_number(params[:model_number]) if params[:model_number].present?
    materials = materials.filter_by_type(params[:material_type]) if params[:material_type].present?

    sort_by = params[:sort_by].presence || "created_at"
    sort_order = params[:sort_order].presence || "desc"

    allowed_sort_columns = ["created_at", "name", "unit_price", "material_type"]
    sort_by = "created_at" unless allowed_sort_columns.include?(sort_by)
    sort_order = "desc" unless ["asc", "desc"].include?(sort_order)

    materials = materials.order("#{sort_by} #{sort_order}")

    render json: {
      materials: materials.as_json(
        only: [:id, :name, :model_number, :unit, :unit_price, :material_type, :discarded_at, :created_at, :updated_at]
      ),
    }
  end

  # GET /admin/materials/:id
  def show
    render json: {
      material: @material.as_json(
        only: [:id, :name, :model_number, :unit, :unit_price, :material_type, :created_at, :updated_at]
      ),
    }
  end

  # POST /admin/materials
  def create
    @material = current_tenant.materials.build(material_params)

    if @material.save
      render json: {
        material: @material.as_json(
          only: [:id, :name, :model_number, :unit, :unit_price, :material_type, :created_at, :updated_at]
        ),
      }, status: :created
    else
      render json: { errors: @material.errors.full_messages }, status: :unprocessable_entity
    end
  end

  # PATCH /admin/materials/:id
  def update
    if @material.update(material_params)
      render json: {
        material: @material.as_json(
          only: [:id, :name, :model_number, :unit, :unit_price, :material_type, :created_at, :updated_at]
        ),
      }
    else
      render json: { errors: @material.errors.full_messages }, status: :unprocessable_entity
    end
  end

  # DELETE /admin/materials/:id
  def destroy
    @material.discard
    head :no_content
  end

  private

  def set_material
    @material = current_tenant.materials.kept.find(params[:id])
  rescue ActiveRecord::RecordNotFound
    render json: { error: "資材が見つかりません" }, status: :not_found
  end

  def material_params
    params.require(:material).permit(:name, :model_number, :unit, :unit_price, :material_type)
  end

  def require_admin
    return if current_user&.has_role?(:admin)

    render json: { error: "この操作を実行する権限がありません" }, status: :forbidden
  end
end
