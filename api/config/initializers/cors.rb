Rails.application.config.middleware.insert_before 0, Rack::Cors do
  allow do
    origins '*'  # 開発中は全許可。将来はドメイン指定に。
    resource '*',
      headers: :any,
      methods: [:get, :post, :options]
  end
end