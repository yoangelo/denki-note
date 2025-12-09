class Users::InvitationsController < Devise::InvitationsController
  respond_to :json

  # Devise親クラスのフィルターをスキップ（API専用のため）
  skip_before_action :authenticate_inviter!, only: [:update] # 招待を受ける側は未認証のため
  skip_before_action :has_invitations_left?, only: [:create, :update] # 招待回数制限は実装しないため
  skip_before_action :require_no_authentication, only: [:update] # API用の認証ロジックを独自実装するため
  skip_before_action :resource_from_invitation_token, only: [:update] # トークンからのリソース取得を手動で行うため

  before_action :authenticate_user!, only: [:create, :index]
  before_action :check_admin_permission, only: [:create]

  def index
    pending_invitations = User.invitation_not_accepted.where(tenant_id: current_user.tenant_id)
    render json: pending_invitations.map { |user|
      {
        id: user.id,
        email: user.email,
        display_name: user.display_name,
        invitation_sent_at: user.invitation_sent_at,
        invitation_created_at: user.invitation_created_at,
      }
    }
  end

  def create
    user = User.invite!(
      {
        email: invite_params[:email],
        display_name: invite_params[:display_name],
        tenant_id: current_user.tenant_id,
      },
      current_user
    )

    if user.errors.empty?
      # role_idsが指定されていない場合はデフォルトでmemberロールを付与
      role_ids = invite_params[:role_ids].presence || [Role.find_by(name: "member")&.id].compact
      user.role_ids = role_ids
      user.save
    end

    if user.errors.empty?
      render json: {
        message: "Invitation sent successfully",
        user: UserSerializer.new(user).serializable_hash[:data][:attributes],
      }, status: :created
    else
      render json: {
        errors: user.errors.full_messages,
      }, status: :unprocessable_entity
    end
  end

  def update
    invitation_token = update_params[:invitation_token]
    self.resource = User.find_by_invitation_token(invitation_token, true)

    if resource.nil?
      render json: {
        errors: ["Invalid invitation token"],
      }, status: :unprocessable_entity
      return
    end

    resource.assign_attributes(
      password: update_params[:password],
      password_confirmation: update_params[:password_confirmation],
      invitation_accepted_at: Time.current
    )

    if resource.save
      resource.update_columns(
        invitation_token: nil,
        invitation_accepted_at: Time.current
      )
      sign_in(resource)
      render json: {
        message: "Password set successfully",
        user: UserSerializer.new(resource).serializable_hash[:data][:attributes],
      }, status: :ok
    else
      render json: {
        errors: resource.errors.full_messages,
      }, status: :unprocessable_entity
    end
  end

  private

  def invite_params
    params.require(:user).permit(:email, :display_name, role_ids: [])
  end

  def update_params
    params.require(:user).permit(:invitation_token, :password, :password_confirmation)
  end

  def check_admin_permission
    return if current_user&.admin?

    render json: { error: "Unauthorized" }, status: :forbidden
  end
end
