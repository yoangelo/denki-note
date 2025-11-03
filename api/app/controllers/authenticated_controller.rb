class AuthenticatedController < ApplicationController
  before_action :authenticate_user!

  private

  def current_tenant
    @current_tenant ||= current_user&.tenant
  end
end
