require 'openapi_first'

module OpenapiSkippable
  SKIP_PATHS = [
    %r{\A/letter_opener},
  ].freeze

  def call(env)
    path = env["PATH_INFO"]
    return @app.call(env) if SKIP_PATHS.any? { |r| r.match?(path) }
    super
  end
end

class OpenapiSkippableRequestValidation < OpenapiFirst::Middlewares::RequestValidation
  include OpenapiSkippable
end

class OpenapiSkippableResponseValidation < OpenapiFirst::Middlewares::ResponseValidation
  include OpenapiSkippable
end
