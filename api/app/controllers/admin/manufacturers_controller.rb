class Admin::ManufacturersController < AuthenticatedController
  before_action :require_admin

  # GET /admin/manufacturers
  def index
    manufacturers = Manufacturer.kept

    manufacturers = manufacturers.where("name ILIKE ?", "%#{params[:keyword]}%") if params[:keyword].present?

    render json: {
      manufacturers: manufacturers.order(:name).as_json(only: [:id, :name]),
    }
  end

  private

  def require_admin
    return if current_user&.has_role?(:admin)

    render json: { error: "この操作を実行する権限がありません" }, status: :forbidden
  end
end
