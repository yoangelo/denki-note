class UsersController < ApplicationController
  # GET /users
  def index
    users = User.all
    users = users.where(is_active: params[:is_active]) if params[:is_active].present?
    
    render json: users.map { |user|
      {
        id: user.id,
        display_name: user.display_name,
        is_active: user.is_active
      }
    }
  end
  
  # GET /users/:id
  def show
    user = User.find(params[:id])
    render json: {
      id: user.id,
      display_name: user.display_name,
      is_active: user.is_active
    }
  rescue ActiveRecord::RecordNotFound
    render json: { error: 'User not found' }, status: :not_found
  end

  # POST /users
  def create
    user = User.new(user_params)
    
    if user.save
      render json: {
        id: user.id,
        display_name: user.display_name,
        is_active: user.is_active
      }, status: :created
    else
      render json: { errors: user.errors.full_messages }, status: :unprocessable_entity
    end
  end

  # PATCH/PUT /users/:id
  def update
    user = User.find(params[:id])
    
    if user.update(user_params)
      render json: {
        id: user.id,
        display_name: user.display_name,
        is_active: user.is_active
      }
    else
      render json: { errors: user.errors.full_messages }, status: :unprocessable_entity
    end
  rescue ActiveRecord::RecordNotFound
    render json: { error: 'User not found' }, status: :not_found
  end

  private

  def user_params
    params.require(:user).permit(:display_name, :is_active, :tenant_id)
  end
end