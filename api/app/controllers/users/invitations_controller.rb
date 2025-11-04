class Users::InvitationsController < Devise::InvitationsController
  respond_to :json
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
        invitation_created_at: user.invitation_created_at
      }
    }
  end

  def create
    self.resource = invite_resource do |user|
      user.tenant_id = current_user.tenant_id
      user.invited_by = current_user
    end

    if resource.errors.empty?
      render json: {
        message: 'Invitation sent successfully',
        user: UserSerializer.new(resource).serializable_hash[:data][:attributes]
      }, status: :created
    else
      render json: {
        errors: resource.errors.full_messages
      }, status: :unprocessable_entity
    end
  end

  def update
    super do |resource|
      if resource.errors.empty?
        sign_in(resource)
      end
    end
  end

  private

  def invite_resource(&block)
    resource_class.invite!(invite_params, current_inviter) do |u|
      block.call(u) if block
      u.skip_invitation = true
    end
  end

  def invite_params
    params.require(:user).permit(:email, :display_name, role_ids: [])
  end

  def respond_with(resource, _opts = {})
    if resource.persisted? && resource.invitation_accepted?
      render json: {
        message: 'Password set successfully',
        user: UserSerializer.new(resource).serializable_hash[:data][:attributes]
      }, status: :ok
    elsif resource.persisted?
      render json: {
        message: 'Invitation sent successfully',
        user: UserSerializer.new(resource).serializable_hash[:data][:attributes]
      }, status: :created
    else
      render json: {
        errors: resource.errors.full_messages
      }, status: :unprocessable_entity
    end
  end

  def check_admin_permission
    unless current_user&.admin?
      render json: { error: 'Unauthorized' }, status: :forbidden
    end
  end
end
