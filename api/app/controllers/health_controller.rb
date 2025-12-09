class HealthController < ApplicationController
  def check
    render json: {
      status: "ok",
      time: Time.zone.now,
      message: "Hello from Rails API 👋",
    }
  end
end
