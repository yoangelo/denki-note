class Users::PasswordsController < Devise::PasswordsController
  respond_to :json

  def create
    self.resource = resource_class.send_reset_password_instructions(resource_params)

    if successfully_sent?(resource)
      render json: {
        message: "Password reset instructions sent to your email",
      }, status: :ok
    else
      render json: {
        errors: resource.errors.full_messages,
      }, status: :unprocessable_entity
    end
  end

  def update
    self.resource = resource_class.reset_password_by_token(resource_params)

    if resource.errors.empty?
      resource.unlock_access! if unlockable?(resource)
      sign_in(resource_name, resource)
      render json: {
        message: "Password updated successfully",
        user: UserSerializer.new(resource).serializable_hash[:data][:attributes],
      }, status: :ok
    else
      render json: {
        errors: resource.errors.full_messages,
      }, status: :unprocessable_entity
    end
  end

  private

  def resource_params
    params.require(:user).permit(:email, :password, :password_confirmation, :reset_password_token)
  end

  # Override to disable flash messages
  def set_flash_message(key, kind, options = {})
    # Do nothing in API mode
  end

  def set_flash_message!(key, kind, options = {})
    # Do nothing in API mode
  end
end
