Rails.application.routes.draw do
  mount LetterOpenerWeb::Engine, at: "/letter_opener" if Rails.env.development?

  devise_for :users, path: 'auth', path_names: {
    sign_in: 'login',
    sign_out: 'logout',
    registration: 'signup'
  }, controllers: {
    sessions: 'users/sessions',
    registrations: 'users/registrations',
    invitations: 'users/invitations',
    passwords: 'users/passwords'
  }

  devise_scope :user do
    get 'auth/invitations/pending', to: 'users/invitations#index'
  end

  get "/health", to: "health#check"

  namespace :admin do
    resources :users, only: [:index, :show, :update, :destroy] do
      member do
        post :add_role
        delete 'roles/:role_id', to: 'users#remove_role', as: :remove_role
      end
    end

    resources :customers, only: [:index, :show, :update, :destroy] do
      collection do
        post :create_bulk
        get :check_duplicate
      end
    end

    resources :sites, only: [:create, :update, :destroy]

    resource :tenant, only: [:show, :update]
  end

  resources :customers, only: [:index] do
    collection do
      get :recent
    end
  end
  resources :sites, only: [:index, :create]
  resources :users, only: [:index]
  resources :daily_reports, only: [:index, :show] do
    collection do
      post :bulk_create
    end
    member do
      put :bulk_update
      delete 'destroy', to: 'daily_reports#destroy', as: ''
    end
  end

  get "/summaries/customer-month", to: "summaries#customer_month"
end
