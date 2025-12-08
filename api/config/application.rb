require_relative "boot"

require "rails"
# Pick the frameworks you want:
require "active_model/railtie"
require "active_job/railtie"
require "active_record/railtie"
require "active_storage/engine"
require "action_controller/railtie"
require "action_mailer/railtie"
require "action_mailbox/engine"
require "action_text/engine"
require "action_view/railtie"
require "action_cable/engine"
# require "rails/test_unit/railtie"

# Require the gems listed in Gemfile, including any gems
# you've limited to :test, :development, or :production.
Bundler.require(*Rails.groups)

module App
  class Application < Rails::Application
    # Initialize configuration defaults for originally generated Rails version.
    config.load_defaults 7.1

    # Please, add to the `ignore` list any other `lib` subdirectories that do
    # not contain `.rb` files, or that should not be reloaded or eager loaded.
    # Common ones are `templates`, `generators`, or `middleware`, for example.
    config.autoload_lib(ignore: %w(assets tasks))

    # Configuration for the application, engines, and railties goes here.
    #
    # These settings can be overridden in specific environments using the files
    # in config/environments, which are processed later.
    #
    # config.time_zone = "Central Time (US & Canada)"
    # config.eager_load_paths << Rails.root.join("extras")

    # Only loads a smaller set of middleware suitable for API only apps.
    # Middleware like session, flash, cookies can be added back manually.
    # Skip views, helpers and assets when generating a new resource.
    config.api_only = true

    # Enable session and cookies for API authentication
    config.middleware.use ActionDispatch::Cookies
    config.middleware.use ActionDispatch::Session::CookieStore, key: '_denki_note_session'

    # ① CORS: 最前に差し込む（OPTIONSはここで204を返す）
    config.middleware.insert_before 0, Rack::Cors do
      allow do
        # devはローカルフロントのみ。将来はENV化（例: CORS_ORIGINS）
        origins ENV.fetch("CORS_ORIGINS", "http://localhost:5173").split(",")

        # credentials=true でCookieを送受信可能にする
        resource "*",
          headers: :any,
          methods: [:get, :post, :put, :patch, :delete, :options, :head],
          credentials: true,
          expose: ['Set-Cookie'],
          max_age: 86_400
      end
    end

    # OpenAPIFirst validation middleware
    # CORSミドルウェアの後に追加されるように、ここで設定
    require_relative 'initializers/openapi_first'

    unless Rails.env.test?
      if Rails.env.development?
        spec_path = File.expand_path('../../openapi/openapi.yaml', __dir__)
        config.middleware.use OpenapiSkippableRequestValidation, spec: spec_path
        config.middleware.use OpenapiSkippableResponseValidation, spec: spec_path
      else
        spec_path = Rails.root.join('openapi', 'openapi.yaml').to_s
        config.middleware.use OpenapiFirst::Middlewares::RequestValidation, spec: spec_path
      end
    end
  end
end
