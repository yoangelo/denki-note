class Users::RegistrationsController < Devise::RegistrationsController
  respond_to :json

  private

  def respond_with(resource, _opts = {})
    if resource.persisted?
      render json: {
        user: UserSerializer.new(resource).serializable_hash[:data][:attributes]
      }, status: :created
    else
      render json: {
        errors: resource.errors.full_messages
      }, status: :unprocessable_entity
    end
  end

  # Override to disable flash messages
  def set_flash_message(key, kind, options = {})
    # Do nothing in API mode
  end

  def set_flash_message!(key, kind, options = {})
    # Do nothing in API mode
  end
end
