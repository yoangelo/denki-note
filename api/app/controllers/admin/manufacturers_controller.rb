class Admin::ManufacturersController < AuthenticatedController
  before_action :require_admin

  # GET /admin/manufacturers
  def index
    manufacturers = Manufacturer.kept

    manufacturers = manufacturers.where("name ILIKE ?", "%#{params[:search]}%") if params[:search].present?

    manufacturers = manufacturers.order(:name).limit(20)

    render json: {
      manufacturers: manufacturers.as_json(only: [:id, :name]),
    }
  end

  private

  def require_admin
    return if current_user&.has_role?(:admin)

    render json: { error: "この操作を実行する権限がありません" }, status: :forbidden
  end
end
