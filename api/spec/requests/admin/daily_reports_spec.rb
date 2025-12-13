require "rails_helper"

RSpec.describe "Admin::DailyReports", type: :request do
  let_it_be(:tenant) { create(:tenant) }
  let_it_be(:other_tenant) { create(:tenant) }
  let_it_be(:admin_user) { create(:user, :admin, tenant: tenant) }
  let_it_be(:member_user) { create(:user, :member, tenant: tenant) }
  let_it_be(:customer) { create(:customer, tenant: tenant) }
  let_it_be(:other_customer) { create(:customer, tenant: tenant) }
  let_it_be(:site) { create(:site, tenant: tenant, customer: customer) }
  let_it_be(:other_site) { create(:site, tenant: tenant, customer: customer) }

  describe "GET /admin/daily_reports/for_invoice" do
    before { sign_in admin_user }

    let!(:daily_report) { create(:daily_report, tenant: tenant, site: site, work_date: "2025-01-15") }
    let!(:product) { create(:product, tenant: tenant, name: "テスト製品", unit: "台", unit_price: 10_000) }
    let!(:material) { create(:material, tenant: tenant, name: "テスト資材", unit: "m", unit_price: 500) }
    let!(:daily_report_product) do
      create(:daily_report_product, daily_report: daily_report, product: product, quantity: 2)
    end
    let!(:daily_report_material) do
      create(:daily_report_material, daily_report: daily_report, material: material, quantity: 5)
    end

    it "顧客IDは必須パラメータ" do
      get "/admin/daily_reports/for_invoice"

      expect(response).to have_http_status(:bad_request)
      expect(json_response["error"]).to eq("顧客IDは必須です")
    end

    it "顧客の日報一覧を返す" do
      get "/admin/daily_reports/for_invoice", params: { customer_id: customer.id }

      expect(response).to have_http_status(:ok)
      expect(json_response["daily_reports"].length).to eq(1)
      expect(json_response["daily_reports"].first["id"]).to eq(daily_report.id)
    end

    it "製品情報を含む" do
      get "/admin/daily_reports/for_invoice", params: { customer_id: customer.id }

      expect(response).to have_http_status(:ok)
      report = json_response["daily_reports"].first

      expect(report["products"].length).to eq(1)
      expect(report["products"].first["name"]).to eq("テスト製品")
      expect(report["products"].first["quantity"]).to eq(2.0)
      expect(report["products"].first["unit_price"]).to eq(10_000)
    end

    it "資材情報を含む" do
      get "/admin/daily_reports/for_invoice", params: { customer_id: customer.id }

      expect(response).to have_http_status(:ok)
      report = json_response["daily_reports"].first

      expect(report["materials"].length).to eq(1)
      expect(report["materials"].first["name"]).to eq("テスト資材")
      expect(report["materials"].first["quantity"]).to eq(5.0)
      expect(report["materials"].first["unit_price"]).to eq(500)
    end

    it "合計金額を計算する" do
      get "/admin/daily_reports/for_invoice", params: { customer_id: customer.id }

      expect(response).to have_http_status(:ok)
      report = json_response["daily_reports"].first

      expected_total = daily_report.labor_cost.to_i + (2 * 10_000) + (5 * 500)
      expect(report["total_amount"]).to eq(expected_total)
    end

    it "現場でフィルタリングできる" do
      create(:daily_report, tenant: tenant, site: other_site)

      get "/admin/daily_reports/for_invoice", params: { customer_id: customer.id, site_id: site.id }

      expect(response).to have_http_status(:ok)
      expect(json_response["daily_reports"].length).to eq(1)
      expect(json_response["daily_reports"].first["id"]).to eq(daily_report.id)
    end

    it "日付範囲でフィルタリングできる" do
      create(:daily_report, tenant: tenant, site: site, work_date: "2025-01-20")

      get "/admin/daily_reports/for_invoice", params: {
        customer_id: customer.id,
        from_date: "2025-01-10",
        to_date: "2025-01-16",
      }

      expect(response).to have_http_status(:ok)
      expect(json_response["daily_reports"].length).to eq(1)
      expect(json_response["daily_reports"].first["report_date"]).to eq("2025-01-15")
    end

    it "指定した請求書に紐づく日報を除外できる" do
      invoice = create(:invoice, :issued, tenant: tenant, customer: customer)
      create(:invoice_daily_report, invoice: invoice, daily_report: daily_report)

      new_report = create(:daily_report, tenant: tenant, site: site, work_date: "2025-01-20")

      get "/admin/daily_reports/for_invoice", params: {
        customer_id: customer.id,
        exclude_invoice_id: invoice.id,
      }

      expect(response).to have_http_status(:ok)
      expect(json_response["daily_reports"].length).to eq(1)
      expect(json_response["daily_reports"].first["id"]).to eq(new_report.id)
    end

    it "削除済みの日報は除外される" do
      daily_report.discard!

      get "/admin/daily_reports/for_invoice", params: { customer_id: customer.id }

      expect(response).to have_http_status(:ok)
      expect(json_response["daily_reports"].length).to eq(0)
    end

    it "他の顧客の日報は返さない" do
      other_customer_site = create(:site, tenant: tenant, customer: other_customer)
      create(:daily_report, tenant: tenant, site: other_customer_site)

      get "/admin/daily_reports/for_invoice", params: { customer_id: customer.id }

      expect(response).to have_http_status(:ok)
      json_response["daily_reports"].each do |report|
        dr = DailyReport.find(report["id"])
        expect(dr.site.customer_id).to eq(customer.id)
      end
    end

    it "ページネーションが動作する" do
      create_list(:daily_report, 25, tenant: tenant, site: site)

      get "/admin/daily_reports/for_invoice", params: { customer_id: customer.id, page: 1, per_page: 10 }

      expect(response).to have_http_status(:ok)
      expect(json_response["daily_reports"].length).to eq(10)
      expect(json_response["meta"]["total_count"]).to eq(26)
      expect(json_response["meta"]["total_pages"]).to eq(3)
      expect(json_response["meta"]["current_page"]).to eq(1)
    end

    context "一般ユーザーの場合" do
      before { sign_in member_user }

      it "403を返す" do
        get "/admin/daily_reports/for_invoice", params: { customer_id: customer.id }

        expect(response).to have_http_status(:forbidden)
      end
    end
  end
end
