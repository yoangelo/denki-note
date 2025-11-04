module Admin
  class UsersController < AuthenticatedController
    before_action :check_admin_permission
    before_action :set_user, only: [:show, :update, :destroy]

    def index
      scope = User.where(tenant_id: current_tenant.id)
        .includes(:roles)
        .order(created_at: :desc)

      if params[:query].present?
        scope = scope.where('display_name ILIKE ? OR email ILIKE ?',
          "%#{params[:query]}%", "%#{params[:query]}%")
      end

      if params[:role].present?
        scope = scope.joins(:roles).where(roles: { name: params[:role] })
      end

      limit = (params[:limit] || 50).to_i.clamp(1, 100)
      users = scope.limit(limit)

      render json: {
        users: users.map { |user|
          UserSerializer.new(user).serializable_hash[:data][:attributes]
        },
        meta: {
          total_count: scope.count,
          returned_count: users.count
        }
      }
    end

    def show
      render json: {
        user: UserSerializer.new(@user).serializable_hash[:data][:attributes]
      }
    end

    def update
      if @user.update(user_update_params)
        render json: {
          message: 'User updated successfully',
          user: UserSerializer.new(@user).serializable_hash[:data][:attributes]
        }
      else
        render json: {
          errors: @user.errors.full_messages
        }, status: :unprocessable_entity
      end
    end

    def destroy
      if @user.id == current_user.id
        return render json: { error: 'Cannot delete yourself' }, status: :unprocessable_entity
      end

      @user.destroy
      render json: { message: 'User deleted successfully' }
    end

    def add_role
      @user = User.find(params[:id])
      role = Role.find_by(name: params[:role_name])

      unless role
        return render json: { error: 'Role not found' }, status: :not_found
      end

      if @user.add_role(role.name, assigned_by: current_user)
        render json: {
          message: 'Role added successfully',
          user: UserSerializer.new(@user).serializable_hash[:data][:attributes]
        }
      else
        render json: { error: 'Failed to add role' }, status: :unprocessable_entity
      end
    end

    def remove_role
      @user = User.find(params[:id])
      role = Role.find(params[:role_id])

      if @user.remove_role(role.name)
        render json: {
          message: 'Role removed successfully',
          user: UserSerializer.new(@user).serializable_hash[:data][:attributes]
        }
      else
        render json: { error: 'Failed to remove role' }, status: :unprocessable_entity
      end
    end

    private

    def set_user
      @user = User.find(params[:id])
      unless @user.tenant_id == current_tenant.id
        render json: { error: 'User not found' }, status: :not_found
      end
    end

    def user_update_params
      params.require(:user).permit(:display_name, :is_active)
    end

    def check_admin_permission
      unless current_user&.admin?
        render json: { error: 'Unauthorized' }, status: :forbidden
      end
    end
  end
end
