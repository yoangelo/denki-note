class Admin::ProductsController < AuthenticatedController
  before_action :require_admin
  before_action :set_product, only: [:show, :update, :destroy]

  # GET /admin/products
  def index
    products = current_tenant.products

    products = params[:show_discarded] == "true" ? products.with_discarded : products.kept

    if params[:keyword].present?
      products = products.where("name ILIKE :keyword OR model_number ILIKE :keyword", keyword: "%#{params[:keyword]}%")
    end

    products = products.where(manufacturer_id: params[:manufacturer_id]) if params[:manufacturer_id].present?

    page = (params[:page] || 1).to_i
    per_page = (params[:per_page] || 10).to_i
    per_page = [per_page, 100].min

    total_count = products.count
    total_pages = (total_count.to_f / per_page).ceil

    products = products.includes(:manufacturer)
                       .order(created_at: :desc)
                       .offset((page - 1) * per_page)
                       .limit(per_page)

    render json: {
      products: products.map { |p| product_json(p) },
      meta: {
        total_count: total_count,
        total_pages: total_pages,
        current_page: page,
        per_page: per_page,
      },
    }
  end

  # GET /admin/products/:id
  def show
    render json: {
      product: product_json(@product),
    }
  end

  # POST /admin/products
  def create
    @product = current_tenant.products.build(product_params)

    if params[:product][:manufacturer_name].present?
      @product.manufacturer = Manufacturer.find_or_create_by!(name: params[:product][:manufacturer_name])
    end

    if @product.save
      render json: { product: product_json(@product) }, status: :created
    else
      render json: { errors: @product.errors.full_messages }, status: :unprocessable_entity
    end
  end

  # PATCH /admin/products/:id
  def update
    if params[:product][:manufacturer_name].present?
      @product.manufacturer = Manufacturer.find_or_create_by!(name: params[:product][:manufacturer_name])
    elsif params[:product].key?(:manufacturer_name) && params[:product][:manufacturer_name].blank?
      @product.manufacturer = nil
    end

    if @product.update(product_params)
      render json: { product: product_json(@product) }
    else
      render json: { errors: @product.errors.full_messages }, status: :unprocessable_entity
    end
  end

  # DELETE /admin/products/:id
  def destroy
    @product.discard
    head :no_content
  end

  private

  def set_product
    @product = current_tenant.products.kept.find(params[:id])
  rescue ActiveRecord::RecordNotFound
    render json: { error: "製品が見つかりません" }, status: :not_found
  end

  def product_params
    params.require(:product).permit(:name, :model_number, :unit, :unit_price)
  end

  def product_json(product)
    {
      id: product.id,
      name: product.name,
      model_number: product.model_number,
      unit: product.unit,
      unit_price: product.unit_price,
      manufacturer_id: product.manufacturer_id,
      manufacturer_name: product.manufacturer&.name,
      discarded_at: product.discarded_at,
      created_at: product.created_at,
      updated_at: product.updated_at,
    }
  end

  def require_admin
    return if current_user&.has_role?(:admin)

    render json: { error: "この操作を実行する権限がありません" }, status: :forbidden
  end
end
