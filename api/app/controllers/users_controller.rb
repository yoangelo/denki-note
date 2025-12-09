class UsersController < AuthenticatedController
  # GET /users
  def index
    return render json: [] unless current_tenant

    users = User.where(tenant: current_tenant)
    users = users.where(is_active: params[:is_active]) if params[:is_active].present?

    render json: users.map { |user|
      {
        id: user.id,
        display_name: user.display_name,
        is_active: user.is_active,
      }
    }
  end
end
