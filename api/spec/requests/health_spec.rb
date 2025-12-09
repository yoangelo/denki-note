require "rails_helper"

RSpec.describe "Health", type: :request do
  describe "GET /health" do
    it "returns ok status" do
      get "/health"

      expect(response).to have_http_status(:ok)
      expect(json_response["status"]).to eq("ok")
      expect(json_response["message"]).to include("Hello from Rails API")
    end
  end
end
