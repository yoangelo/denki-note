Rails.application.routes.draw do
  get "/health", to: "health#check"

  resources :customers, only: [:index, :create]
  resources :sites, only: [:index, :create]
  resources :users, only: [:index, :show, :create, :update]
  resources :daily_reports, only: [:create, :index]

  post "/work_entries/bulk", to: "work_entries#bulk"

  get "/summaries/customer-month", to: "summaries#customer_month"
end
