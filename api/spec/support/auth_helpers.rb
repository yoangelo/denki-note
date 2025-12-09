module AuthHelpers
  def sign_in_as(user)
    post "/auth/login", params: { user: { email: user.email, password: "password123" } }
  end

  def json_response
    JSON.parse(response.body)
  end
end

module JsonRequestHelper
  ["get", "post", "put", "patch", "delete"].each do |method|
    define_method(method) do |path, **options|
      options[:headers] ||= {}
      options[:headers]["Content-Type"] ||= "application/json"
      options[:headers]["Accept"] ||= "application/json"
      if options[:params].is_a?(Hash) && !options[:params].empty? && ["post", "put", "patch"].include?(method)
        options[:params] = options[:params].to_json
      end
      super(path, **options)
    end
  end
end

RSpec.configure do |config|
  config.include AuthHelpers, type: :request
  config.include Devise::Test::IntegrationHelpers, type: :request
  config.include JsonRequestHelper, type: :request

  config.before(:each, type: :request) do
    host! "localhost"
  end

  # Setup shared roles once for all tests
  config.before(:suite) do
    Role.find_or_create_by!(name: "admin") do |role|
      role.display_name = "管理者"
      role.description = "システム管理者"
    end
    Role.find_or_create_by!(name: "member") do |role|
      role.display_name = "メンバー"
      role.description = "一般メンバー"
    end
  end
end
