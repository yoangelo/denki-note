require "rails_helper"

RSpec.describe "Customers", type: :request do
  let_it_be(:tenant) { create(:tenant) }
  let_it_be(:user) { create(:user, tenant: tenant) }

  before { sign_in user }

  describe "GET /customers" do
    context "認証済みの場合" do
      let!(:customer1) { create(:customer, tenant: tenant, name: "ABC株式会社") }
      let!(:customer2) { create(:customer, tenant: tenant, name: "XYZ株式会社") }
      let!(:other_tenant_customer) { create(:customer, name: "他テナント顧客") }

      it "自テナントの顧客一覧を返す" do
        get "/customers"

        expect(response).to have_http_status(:ok)
        expect(json_response.length).to eq(2)
        names = json_response.pluck("name")
        expect(names).to include("ABC株式会社", "XYZ株式会社")
        expect(names).not_to include("他テナント顧客")
      end

      it "クエリで検索できる" do
        get "/customers", params: { query: "ABC" }

        expect(response).to have_http_status(:ok)
        expect(json_response.length).to eq(1)
        expect(json_response.first["name"]).to eq("ABC株式会社")
      end

      it "limitで件数を制限できる" do
        get "/customers", params: { limit: 1 }

        expect(response).to have_http_status(:ok)
        expect(json_response.length).to eq(1)
      end
    end

    context "未認証の場合" do
      before { sign_out user }

      it "401を返す" do
        get "/customers"

        expect(response).to have_http_status(:unauthorized)
      end
    end
  end

  describe "GET /customers/recent" do
    context "認証済みの場合" do
      let(:customer) { create(:customer, tenant: tenant) }
      let(:site) { create(:site, tenant: tenant, customer: customer) }
      let!(:daily_report) { create(:daily_report, tenant: tenant, site: site, work_user: user) }

      it "最近使用した顧客一覧を返す" do
        get "/customers/recent"

        expect(response).to have_http_status(:ok)
        expect(json_response.length).to be <= 3
      end
    end
  end
end
