require "rails_helper"

RSpec.describe "Admin::Invoices", type: :request do
  let_it_be(:tenant) { create(:tenant) }
  let_it_be(:other_tenant) { create(:tenant) }
  let_it_be(:admin_user) { create(:user, :admin, tenant: tenant) }
  let_it_be(:member_user) { create(:user, :member, tenant: tenant) }
  let_it_be(:customer) { create(:customer, tenant: tenant) }
  let_it_be(:site) { create(:site, tenant: tenant, customer: customer) }

  describe "GET /admin/invoices" do
    context "管理者の場合" do
      before { sign_in admin_user }

      let!(:invoice1) { create(:invoice, tenant: tenant, customer: customer, billing_date: "2025-01-15") }
      let!(:invoice2) { create(:invoice, :issued, tenant: tenant, customer: customer, billing_date: "2025-01-20") }
      let!(:discarded_invoice) { create(:invoice, :discarded, tenant: tenant, customer: customer) }

      it "請求書一覧を返す（削除済み除外）" do
        get "/admin/invoices"

        expect(response).to have_http_status(:ok)
        expect(json_response["invoices"].length).to eq(2)
        expect(json_response["meta"]["total_count"]).to eq(2)
      end

      it "削除済みを含めて取得できる" do
        get "/admin/invoices", params: { show_discarded: "true" }

        expect(response).to have_http_status(:ok)
        expect(json_response["invoices"].length).to eq(3)
      end

      it "顧客でフィルタリングできる" do
        other_customer = create(:customer, tenant: tenant)
        create(:invoice, tenant: tenant, customer: other_customer)

        get "/admin/invoices", params: { customer_id: customer.id }

        expect(response).to have_http_status(:ok)
        expect(json_response["invoices"].length).to eq(2)
        json_response["invoices"].each do |invoice|
          expect(invoice["customer_id"]).to eq(customer.id)
        end
      end

      it "ステータスでフィルタリングできる" do
        get "/admin/invoices", params: { status: "issued" }

        expect(response).to have_http_status(:ok)
        expect(json_response["invoices"].length).to eq(1)
        expect(json_response["invoices"].first["status"]).to eq("issued")
      end

      it "ソートできる" do
        get "/admin/invoices", params: { sort_by: "billing_date", sort_order: "asc" }

        expect(response).to have_http_status(:ok)
        dates = json_response["invoices"].pluck("billing_date")
        expect(dates).to eq(dates.sort)
      end

      it "ページネーションが動作する" do
        get "/admin/invoices", params: { page: 1, per_page: 1 }

        expect(response).to have_http_status(:ok)
        expect(json_response["invoices"].length).to eq(1)
        expect(json_response["meta"]["total_pages"]).to eq(2)
      end
    end

    context "一般ユーザーの場合" do
      before { sign_in member_user }

      it "403を返す" do
        get "/admin/invoices"

        expect(response).to have_http_status(:forbidden)
      end
    end
  end

  describe "GET /admin/invoices/:id" do
    before { sign_in admin_user }

    let!(:invoice) { create(:invoice, tenant: tenant, customer: customer, site: site) }
    let!(:invoice_item) do
      create(:invoice_item, invoice: invoice, item_type: "product", name: "テスト製品", quantity: 2, unit_price: 1000)
    end
    let!(:daily_report) { create(:daily_report, tenant: tenant, site: site) }
    let!(:invoice_daily_report) { create(:invoice_daily_report, invoice: invoice, daily_report: daily_report) }
    let!(:bank_account) { create(:bank_account, :default, tenant: tenant) }

    it "請求書詳細を返す（請求項目・日報含む）" do
      get "/admin/invoices/#{invoice.id}"

      expect(response).to have_http_status(:ok)
      expect(json_response["invoice"]["id"]).to eq(invoice.id)
      expect(json_response["invoice"]["site_name"]).to eq(site.name)
      expect(json_response["invoice_items"].length).to eq(1)
      expect(json_response["invoice_items"].first["name"]).to eq("テスト製品")
      expect(json_response["daily_reports"].length).to eq(1)
      expect(json_response["bank_account"]["bank_name"]).to eq(bank_account.bank_name)
    end

    it "存在しない請求書の場合は404" do
      get "/admin/invoices/00000000-0000-0000-0000-000000000000"

      expect(response).to have_http_status(:not_found)
    end

    context "異なるテナントの請求書の場合" do
      let!(:other_invoice) { create(:invoice, tenant: other_tenant) }

      it "404を返す" do
        get "/admin/invoices/#{other_invoice.id}"

        expect(response).to have_http_status(:not_found)
      end
    end
  end

  describe "POST /admin/invoices" do
    before { sign_in admin_user }

    let(:valid_params) do
      {
        invoice: {
          customer_id: customer.id,
          site_id: site.id,
          billing_date: "2025-01-31",
          customer_name: customer.name,
          title: "1月分工事代金",
          tax_rate: 10.0,
        },
        invoice_items: [
          {
            item_type: "header",
            name: "2025/01/15 作業分",
            sort_order: 1,
          },
          {
            item_type: "product",
            name: "テスト製品",
            quantity: 2,
            unit: "台",
            unit_price: 10_000,
            sort_order: 2,
          },
        ],
      }
    end

    it "請求書を作成できる" do
      expect do
        post "/admin/invoices", params: valid_params
      end.to change(Invoice, :count).by(1)

      expect(response).to have_http_status(:created)
      expect(json_response["invoice"]["title"]).to eq("1月分工事代金")
      expect(json_response["invoice"]["status"]).to eq("draft")
    end

    it "請求項目も同時に作成できる" do
      post "/admin/invoices", params: valid_params

      expect(response).to have_http_status(:created)
      expect(json_response["invoice_items"].length).to eq(2)
    end

    it "日報を紐付けできる" do
      daily_report = create(:daily_report, tenant: tenant, site: site)
      params = valid_params.merge(daily_report_ids: [daily_report.id])

      post "/admin/invoices", params: params

      expect(response).to have_http_status(:created)
      expect(json_response["daily_reports"].length).to eq(1)
    end

    it "顧客IDがない場合はエラー" do
      post "/admin/invoices", params: { invoice: { billing_date: "2025-01-31" } }

      expect(response).to have_http_status(:unprocessable_entity)
    end
  end

  describe "PATCH /admin/invoices/:id" do
    before { sign_in admin_user }

    context "下書きの場合" do
      let!(:invoice) { create(:invoice, tenant: tenant, customer: customer, title: "変更前") }

      it "請求書を更新できる" do
        patch "/admin/invoices/#{invoice.id}", params: { invoice: { title: "変更後" } }

        expect(response).to have_http_status(:ok)
        expect(json_response["invoice"]["title"]).to eq("変更後")
      end

      it "請求項目を追加・更新・削除できる" do
        existing_item = create(:invoice_item, invoice: invoice, name: "既存項目")

        patch "/admin/invoices/#{invoice.id}", params: {
          invoice_items: [
            { id: existing_item.id, item_type: "product", name: "更新された項目", quantity: 1, unit_price: 500,
              sort_order: 1, },
            { item_type: "material", name: "新規項目", quantity: 3, unit_price: 200, sort_order: 2 },
          ],
        }

        expect(response).to have_http_status(:ok)
        expect(json_response["invoice_items"].length).to eq(2)
        expect(json_response["invoice_items"].find { |i| i["id"] == existing_item.id }["name"]).to eq("更新された項目")
      end
    end

    context "発行済みの場合" do
      let!(:invoice) { create(:invoice, :issued, tenant: tenant, customer: customer, title: "発行済み") }

      it "請求書を更新できる" do
        patch "/admin/invoices/#{invoice.id}", params: { invoice: { title: "発行済み変更後" } }

        expect(response).to have_http_status(:ok)
        expect(json_response["invoice"]["title"]).to eq("発行済み変更後")
      end
    end

    context "取消済みの場合" do
      let!(:invoice) { create(:invoice, :canceled, tenant: tenant, customer: customer) }

      it "更新できない" do
        patch "/admin/invoices/#{invoice.id}", params: { invoice: { title: "変更" } }

        expect(response).to have_http_status(:unprocessable_entity)
        expect(json_response["error"]).to include("取消済み")
      end
    end
  end

  describe "POST /admin/invoices/:id/issue" do
    before { sign_in admin_user }

    context "下書きの場合" do
      let!(:invoice) { create(:invoice, tenant: tenant, customer: customer) }
      let!(:invoice_item) { create(:invoice_item, invoice: invoice, quantity: 1, unit_price: 1000) }

      it "発行できる" do
        post "/admin/invoices/#{invoice.id}/issue"

        expect(response).to have_http_status(:ok)
        expect(json_response["invoice"]["status"]).to eq("issued")
        expect(json_response["invoice"]["invoice_number"]).to be_present
        expect(json_response["invoice"]["issued_at"]).to be_present
      end

      it "請求書番号が自動採番される" do
        post "/admin/invoices/#{invoice.id}/issue"

        expect(json_response["invoice"]["invoice_number"]).to match(/\AINV-\d{4}-\d{3}\z/)
      end
    end

    context "発行済みの場合" do
      let!(:invoice) { create(:invoice, :issued, tenant: tenant, customer: customer) }

      it "発行できない" do
        post "/admin/invoices/#{invoice.id}/issue"

        expect(response).to have_http_status(:unprocessable_entity)
      end
    end
  end

  describe "POST /admin/invoices/:id/cancel" do
    before { sign_in admin_user }

    context "下書きの場合" do
      let!(:invoice) { create(:invoice, tenant: tenant, customer: customer) }

      it "取消できる" do
        post "/admin/invoices/#{invoice.id}/cancel"

        expect(response).to have_http_status(:ok)
        expect(json_response["invoice"]["status"]).to eq("canceled")
      end
    end

    context "発行済みの場合" do
      let!(:invoice) { create(:invoice, :issued, tenant: tenant, customer: customer) }

      it "取消できる" do
        post "/admin/invoices/#{invoice.id}/cancel"

        expect(response).to have_http_status(:ok)
        expect(json_response["invoice"]["status"]).to eq("canceled")
      end
    end

    context "取消済みの場合" do
      let!(:invoice) { create(:invoice, :canceled, tenant: tenant, customer: customer) }

      it "取消できない" do
        post "/admin/invoices/#{invoice.id}/cancel"

        expect(response).to have_http_status(:unprocessable_entity)
      end
    end
  end

  describe "POST /admin/invoices/:id/copy" do
    before { sign_in admin_user }

    let!(:invoice) { create(:invoice, :issued, tenant: tenant, customer: customer, title: "コピー元") }
    let!(:invoice_item) { create(:invoice_item, invoice: invoice, name: "コピー元項目") }

    it "新しい下書きとしてコピーできる" do
      expect do
        post "/admin/invoices/#{invoice.id}/copy"
      end.to change(Invoice, :count).by(1)

      expect(response).to have_http_status(:created)
      expect(json_response["invoice"]["status"]).to eq("draft")
      expect(json_response["invoice"]["invoice_number"]).to be_nil
      expect(json_response["invoice"]["issued_at"]).to be_nil
      expect(json_response["invoice"]["title"]).to eq("コピー元")
    end

    it "請求項目もコピーされる" do
      post "/admin/invoices/#{invoice.id}/copy"

      expect(json_response["invoice_items"].length).to eq(2)
      expect(json_response["invoice_items"].pluck("name")).to include("コピー元項目")
    end

    it "billing_dateは今日の日付になる" do
      post "/admin/invoices/#{invoice.id}/copy"

      expect(json_response["invoice"]["billing_date"]).to eq(Date.current.to_s)
    end
  end
end
