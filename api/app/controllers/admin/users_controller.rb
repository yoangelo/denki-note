module Admin
  # ユーザー管理を行う管理者用コントローラー
  class UsersController < AuthenticatedController
    before_action :check_admin_permission
    before_action :set_user, only: [:show, :update, :destroy]

    # ユーザー一覧を取得する
    #
    # query（名前・メール）、roleでフィルタリング可能。
    # 結果は作成日時の降順でソートされる。
    #
    # @return [Hash] ユーザー一覧とメタ情報
    #   - users [Array<Hash>] ユーザーデータの配列
    #   - meta [Hash] 総件数、返却件数
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

    # ユーザーの詳細を取得する
    #
    # @return [Hash] ユーザーの詳細情報（user）
    def show
      render json: {
        user: UserSerializer.new(@user).serializable_hash[:data][:attributes]
      }
    end

    # ユーザー情報を更新する
    #
    # @return [Hash] 更新結果
    #   - message [String] 成功メッセージ
    #   - user [Hash] 更新後のユーザーデータ
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

    # ユーザーを削除する
    #
    # 自分自身を削除することはできない。
    #
    # @return [Hash] 削除結果（message）
    def destroy
      if @user.id == current_user.id
        return render json: { error: 'Cannot delete yourself' }, status: :unprocessable_entity
      end

      @user.destroy
      render json: { message: 'User deleted successfully' }
    end

    # ユーザーにロールを追加する
    #
    # @return [Hash] 追加結果
    #   - message [String] 成功メッセージ
    #   - user [Hash] 更新後のユーザーデータ
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

    # ユーザーからロールを削除する
    #
    # @return [Hash] 削除結果
    #   - message [String] 成功メッセージ
    #   - user [Hash] 更新後のユーザーデータ
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

    # 対象ユーザーを取得してインスタンス変数にセットする
    #
    # 同一テナントのユーザーでない場合は404を返す。
    #
    # @return [void]
    def set_user
      @user = User.find(params[:id])
      unless @user.tenant_id == current_tenant.id
        render json: { error: 'User not found' }, status: :not_found
      end
    end

    # updateアクション用のパラメータを許可する
    #
    # @return [ActionController::Parameters] 許可されたパラメータ（display_name, is_active）
    def user_update_params
      params.require(:user).permit(:display_name, :is_active)
    end

    # 管理者権限を確認する
    #
    # 管理者でない場合は403 Forbiddenを返す。
    #
    # @return [void]
    def check_admin_permission
      unless current_user&.admin?
        render json: { error: 'Unauthorized' }, status: :forbidden
      end
    end
  end
end
