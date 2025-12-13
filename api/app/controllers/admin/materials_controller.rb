class Admin::MaterialsController < AuthenticatedController
  before_action :require_admin
  before_action :set_material, only: [:show, :update, :destroy]

  # GET /admin/materials
  def index
    materials = current_tenant.materials

    materials = params[:show_discarded] == "true" ? materials.with_discarded : materials.kept

    if params[:keyword].present?
      materials = materials.where("name ILIKE :keyword OR model_number ILIKE :keyword",
                                  keyword: "%#{params[:keyword]}%")
    end

    materials = materials.filter_by_type(params[:material_type]) if params[:material_type].present?

    page = (params[:page] || 1).to_i
    per_page = (params[:per_page] || 10).to_i
    per_page = [per_page, 100].min

    total_count = materials.count
    total_pages = (total_count.to_f / per_page).ceil

    materials = materials.order(created_at: :desc)
                         .offset((page - 1) * per_page)
                         .limit(per_page)

    render json: {
      materials: materials.as_json(only: [:id, :name, :model_number, :unit, :unit_price, :material_type,
                                          :discarded_at, :created_at, :updated_at,]),
      meta: {
        total_count: total_count,
        total_pages: total_pages,
        current_page: page,
        per_page: per_page,
      },
    }
  end

  # GET /admin/materials/types
  def types
    material_types = current_tenant.materials.kept
                                   .where.not(material_type: [nil, ""])
                                   .distinct
                                   .pluck(:material_type)
                                   .sort

    render json: { material_types: material_types }
  end

  # GET /admin/materials/:id
  def show
    render json: {
      material: @material.as_json(only: [:id, :name, :model_number, :unit, :unit_price, :material_type,
                                         :discarded_at, :created_at, :updated_at,]),
    }
  end

  # POST /admin/materials
  def create
    @material = current_tenant.materials.build(material_params)

    if @material.save
      render json: {
        material: @material.as_json(only: [:id, :name, :model_number, :unit, :unit_price, :material_type,
                                           :created_at, :updated_at,]),
      }, status: :created
    else
      render json: { errors: @material.errors.full_messages }, status: :unprocessable_entity
    end
  end

  # PATCH /admin/materials/:id
  def update
    if @material.update(material_params)
      render json: {
        material: @material.as_json(only: [:id, :name, :model_number, :unit, :unit_price, :material_type,
                                           :created_at, :updated_at,]),
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
