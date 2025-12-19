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
        daily_report.save!
      end

      it "顧客月次サマリーを返す" do
        get "/summaries/customer-month", params: { customer_id: customer.id, yyyymm: "2024-01" }

        expect(response).to have_http_status(:ok)
        expect(json_response["rows"].length).to eq(1)
        expect(json_response["total_hours"]).to eq(2.0)
      end

      it "工賃を正しく返す" do
        get "/summaries/customer-month", params: { customer_id: customer.id, yyyymm: "2024-01" }

        expect(response).to have_http_status(:ok)
        expect(json_response["labor_cost_jpy"]).to eq(daily_report.reload.labor_cost.to_i)
        expect(json_response["product_amount_jpy"]).to eq(0)
        expect(json_response["material_amount_jpy"]).to eq(0)
        expect(json_response["total_amount_jpy"]).to eq(daily_report.labor_cost.to_i)
      end

      it "製品・資材金額を含めた合計を返す" do
        product = create(:product, tenant: tenant, unit_price: 1000)
        material = create(:material, tenant: tenant, unit_price: 500)
        create(:daily_report_product, daily_report: daily_report, product: product, quantity: 2)
        create(:daily_report_material, daily_report: daily_report, material: material, quantity: 3)

        get "/summaries/customer-month", params: { customer_id: customer.id, yyyymm: "2024-01" }

        expect(response).to have_http_status(:ok)
        expect(json_response["product_amount_jpy"]).to eq(2000)
        expect(json_response["material_amount_jpy"]).to eq(1500)
        expect(json_response["total_amount_jpy"]).to eq(daily_report.reload.labor_cost.to_i + 2000 + 1500)
      end

      it "不正な日付形式の場合はエラー" do
        get "/summaries/customer-month", params: { customer_id: customer.id, yyyymm: "invalid" }

        expect(response).to have_http_status(:bad_request)
      end
    end
  end
end
