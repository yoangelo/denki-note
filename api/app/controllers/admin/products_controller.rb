class Admin::ProductsController < AuthenticatedController
  before_action :require_admin
  before_action :set_product, only: [:show, :update, :destroy]

  # GET /admin/products
  def index
    products = current_tenant.products

    products = params[:show_discarded] == "true" ? products.with_discarded : products.kept

    products = products.search_by_name(params[:search]) if params[:search].present?
    products = products.search_by_model_number(params[:model_number]) if params[:model_number].present?

    sort_by = params[:sort_by].presence || "created_at"
    sort_order = params[:sort_order].presence || "desc"

    allowed_sort_columns = ["created_at", "name", "unit_price"]
    sort_by = "created_at" unless allowed_sort_columns.include?(sort_by)
    sort_order = "desc" unless ["asc", "desc"].include?(sort_order)

    products = products.includes(:manufacturer).order("#{sort_by} #{sort_order}")

    render json: {
      products: products.as_json(
        only: [:id, :name, :model_number, :unit, :unit_price, :discarded_at, :created_at, :updated_at],
        include: { manufacturer: { only: [:id, :name] } }
      ),
    }
  end

  # GET /admin/products/:id
  def show
    render json: {
      product: @product.as_json(
        only: [:id, :name, :model_number, :unit, :unit_price, :created_at, :updated_at],
        include: { manufacturer: { only: [:id, :name] } }
      ),
    }
  end

  # POST /admin/products
  def create
    @product = current_tenant.products.build(product_params)

    if params[:manufacturer_name].present?
      manufacturer = Manufacturer.find_or_create_by!(name: params[:manufacturer_name])
      @product.manufacturer = manufacturer
    end

    if @product.save
      render json: {
        product: @product.as_json(
          only: [:id, :name, :model_number, :unit, :unit_price, :created_at, :updated_at],
          include: { manufacturer: { only: [:id, :name] } }
        ),
      }, status: :created
    else
      render json: { errors: @product.errors.full_messages }, status: :unprocessable_entity
    end
  end

  # PATCH /admin/products/:id
  def update
    if params[:manufacturer_name].present?
      manufacturer = Manufacturer.find_or_create_by!(name: params[:manufacturer_name])
      @product.manufacturer = manufacturer
    elsif params[:manufacturer_name] == ""
      @product.manufacturer = nil
    end

    if @product.update(product_params)
      render json: {
        product: @product.as_json(
          only: [:id, :name, :model_number, :unit, :unit_price, :created_at, :updated_at],
          include: { manufacturer: { only: [:id, :name] } }
        ),
      }
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

  def require_admin
    return if current_user&.has_role?(:admin)

    render json: { error: "この操作を実行する権限がありません" }, status: :forbidden
  end
end
