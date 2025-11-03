class ApplicationController < ActionController::API
  include ActionController::Cookies

  before_action :configure_permitted_parameters, if: :devise_controller?

  protected

  def configure_permitted_parameters
    devise_parameter_sanitizer.permit(:sign_up, keys: [:display_name, :tenant_id])
    devise_parameter_sanitizer.permit(:account_update, keys: [:display_name])
  end
end
