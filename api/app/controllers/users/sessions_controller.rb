class Users::SessionsController < Devise::SessionsController
  respond_to :json

  # Disable flash messages and redirects in API mode
  skip_before_action :require_no_authentication, only: [:create]
  skip_before_action :verify_signed_out_user, only: :destroy

  private

  def respond_with(resource, _opts = {})
    render json: {
      user: UserSerializer.new(resource).serializable_hash[:data][:attributes],
    }, status: :ok
  end

  def respond_to_on_destroy
    render json: { message: "Logged out successfully" }, status: :ok
  end

  # Override to disable flash messages
  def set_flash_message(key, kind, options = {})
    # Do nothing in API mode
  end

  def set_flash_message!(key, kind, options = {})
    # Do nothing in API mode
  end
end
