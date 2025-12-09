require "rails_helper"

RSpec.describe "Summaries", type: :request do
  let_it_be(:tenant) { create(:tenant) }
  let_it_be(:user) { create(:user, tenant: tenant) }
  let_it_be(:customer) { create(:customer, tenant: tenant, rate_percent: 120) }
  let_it_be(:site) { create(:site, tenant: tenant, customer: customer) }
  let_it_be(:tenant_setting) { create(:tenant_setting, tenant: tenant, default_unit_rate: 3000) }

  before { sign_in user }

  describe "GET /summaries/customer-month" do
    context "認証済みの場合" do
      let!(:daily_report) do
        create(:daily_report, tenant: tenant, site: site, work_date: Date.new(2024, 1, 15), work_user: user)
      end

      before do
        daily_report.work_entries.first.update!(minutes: 120)
      end

      it "顧客月次サマリーを返す" do
        get "/summaries/customer-month", params: { customer_id: customer.id, yyyymm: "2024-01" }

        expect(response).to have_http_status(:ok)
        expect(json_response["rows"].length).to eq(1)
        expect(json_response["total_hours"]).to eq(2.0)
      end

      it "掛率を適用できる" do
        get "/summaries/customer-month", params: { customer_id: customer.id, yyyymm: "2024-01", rate_toggle: "on" }

        expect(response).to have_http_status(:ok)
        expect(json_response["amount_jpy"]).to eq(7200)
      end

      it "掛率なしの場合" do
        get "/summaries/customer-month", params: { customer_id: customer.id, yyyymm: "2024-01", rate_toggle: "off" }

        expect(response).to have_http_status(:ok)
        expect(json_response["amount_jpy"]).to eq(6000)
      end

      it "不正な日付形式の場合はエラー" do
        get "/summaries/customer-month", params: { customer_id: customer.id, yyyymm: "invalid" }

        expect(response).to have_http_status(:bad_request)
      end
    end
  end
end
