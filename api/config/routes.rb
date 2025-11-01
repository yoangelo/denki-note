Rails.application.routes.draw do
  get "/health", to: "health#check"

  resources :customers, only: [:index, :create] do
    collection do
      get :recent
    end
  end
  resources :sites, only: [:index, :create]
  resources :users, only: [:index, :show, :create, :update]
  resources :daily_reports, only: [:create, :index] do
    collection do
      post :bulk
    end
  end

  get "/summaries/customer-month", to: "summaries#customer_month"
end
