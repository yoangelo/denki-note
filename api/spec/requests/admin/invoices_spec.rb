require "rails_helper"

RSpec.describe "Admin::Invoices", type: :request do
  let_it_be(:tenant) { create(:tenant) }
  let_it_be(:admin_user) { create(:user, :admin, tenant: tenant) }
  let_it_be(:member_user) { create(:user, :member, tenant: tenant) }
  let_it_be(:customer) { create(:customer, tenant: tenant, name: "テスト顧客") }
  let_it_be(:site) { create(:site, tenant: tenant, customer: customer, name: "テスト現場") }

  describe "GET /admin/invoices" do
    context "管理者の場合" do
      before { sign_in admin_user }

      let!(:invoice1) do
        create(:invoice, tenant: tenant, customer: customer, site: site, status: :draft)
      end
      let!(:invoice2) do
        create(:invoice, :issued, tenant: tenant, customer: customer, invoice_number: "INV-2025-001")
      end
      let!(:canceled_invoice) do
        create(:invoice, :canceled, tenant: tenant, customer: customer)
      end

      it "請求書一覧を返す（取消済み除外）" do
        get "/admin/invoices"

        expect(response).to have_http_status(:ok)
        expect(json_response["invoices"].length).to eq(2)
      end

      it "取消済みを含めて取得できる" do
        get "/admin/invoices", params: { show_discarded: "true" }

        expect(response).to have_http_status(:ok)
        expect(json_response["invoices"].length).to eq(3)
      end

      it "顧客でフィルタリングできる" do
        other_customer = create(:customer, tenant: tenant, name: "他の顧客")
        create(:invoice, tenant: tenant, customer: other_customer)

        get "/admin/invoices", params: { customer_id: customer.id }

        expect(response).to have_http_status(:ok)
        expect(json_response["invoices"].length).to eq(2)
      end

      it "現場でフィルタリングできる" do
        get "/admin/invoices", params: { site_id: site.id }

        expect(response).to have_http_status(:ok)
        expect(json_response["invoices"].length).to eq(1)
        expect(json_response["invoices"].first["site_id"]).to eq(site.id)
      end

      it "ステータスでフィルタリングできる" do
        get "/admin/invoices", params: { status: "draft" }

        expect(response).to have_http_status(:ok)
        expect(json_response["invoices"].length).to eq(1)
        expect(json_response["invoices"].first["status"]).to eq("draft")
      end

      it "発行日でフィルタリングできる" do
        get "/admin/invoices", params: { issued_from: Date.current.to_s, issued_to: Date.current.to_s }

        expect(response).to have_http_status(:ok)
        invoices = json_response["invoices"]
        expect(invoices.all? { |inv| inv["status"] == "issued" }).to be true
      end

      it "ソートできる" do
        get "/admin/invoices", params: { sort_by: "total_amount", sort_order: "asc" }

        expect(response).to have_http_status(:ok)
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

    let!(:invoice) do
      create(:invoice, tenant: tenant, customer: customer, site: site, title: "テスト請求書")
    end
    let!(:invoice_item) do
      create(:invoice_item, :product, invoice: invoice, name: "製品A", quantity: 2, unit_price: 1000)
    end

    it "請求書詳細を返す" do
      get "/admin/invoices/#{invoice.id}"

      expect(response).to have_http_status(:ok)
      expect(json_response["invoice"]["id"]).to eq(invoice.id)
      expect(json_response["invoice"]["title"]).to eq("テスト請求書")
      expect(json_response["invoice"]["customer_name"]).to eq("テスト顧客")
      expect(json_response["invoice"]["site_name"]).to eq("テスト現場")
    end

    it "請求項目を含む" do
      get "/admin/invoices/#{invoice.id}"

      expect(response).to have_http_status(:ok)
      expect(json_response["invoice_items"].length).to eq(1)
      expect(json_response["invoice_items"].first["name"]).to eq("製品A")
      expect(json_response["invoice_items"].first["amount"]).to eq(2000)
    end

    it "存在しない請求書の場合は404" do
      get "/admin/invoices/00000000-0000-0000-0000-000000000000"

      expect(response).to have_http_status(:not_found)
    end
  end

  describe "POST /admin/invoices" do
    before { sign_in admin_user }

    let(:valid_params) do
      {
        invoice: {
          customer_id: customer.id,
          site_id: site.id,
          title: "新規請求書",
          tax_rate: 10,
          note: "備考",
        },
        invoice_items: [
          {
            item_type: "product",
            name: "製品A",
            quantity: 2,
            unit: "個",
            unit_price: 1000,
          },
          {
            item_type: "material",
            name: "資材B",
            quantity: 5,
            unit: "m",
            unit_price: 500,
          },
        ],
      }
    end

    it "請求書を作成できる" do
      expect do
        post "/admin/invoices", params: valid_params
      end.to change(Invoice, :count).by(1)

      expect(response).to have_http_status(:created)
      expect(json_response["invoice"]["title"]).to eq("新規請求書")
      expect(json_response["invoice"]["status"]).to eq("draft")
      expect(json_response["invoice"]["customer_name"]).to eq("テスト顧客")
    end

    it "請求項目が作成される" do
      post "/admin/invoices", params: valid_params

      expect(response).to have_http_status(:created)
      expect(json_response["invoice_items"].length).to eq(2)
    end

    it "金額が計算される" do
      post "/admin/invoices", params: valid_params

      expect(response).to have_http_status(:created)
      expect(json_response["invoice"]["subtotal"]).to eq(4500)
      expect(json_response["invoice"]["tax_amount"]).to eq(450)
      expect(json_response["invoice"]["total_amount"]).to eq(4950)
    end

    it "顧客IDが空の場合はエラー" do
      invalid_params = valid_params.deep_dup
      invalid_params[:invoice][:customer_id] = nil

      post "/admin/invoices", params: invalid_params

      expect(response).to have_http_status(:unprocessable_entity)
    end
  end

  describe "PATCH /admin/invoices/:id" do
    before { sign_in admin_user }

    let!(:invoice) do
      create(:invoice, tenant: tenant, customer: customer, title: "変更前")
    end

    it "請求書を更新できる" do
      patch "/admin/invoices/#{invoice.id}", params: { invoice: { title: "変更後" } }

      expect(response).to have_http_status(:ok)
      expect(json_response["invoice"]["title"]).to eq("変更後")
    end

    it "請求項目を更新できる" do
      patch "/admin/invoices/#{invoice.id}", params: {
        invoice: { title: invoice.title },
        invoice_items: [
          { item_type: "product", name: "新製品", quantity: 1, unit: "個", unit_price: 2000 },
        ],
      }

      expect(response).to have_http_status(:ok)
      expect(json_response["invoice_items"].length).to eq(1)
      expect(json_response["invoice_items"].first["name"]).to eq("新製品")
    end

    context "発行済み請求書の場合" do
      let!(:issued_invoice) do
        create(:invoice, :issued, tenant: tenant, customer: customer, title: "発行済み")
      end

      it "更新できる" do
        patch "/admin/invoices/#{issued_invoice.id}", params: { invoice: { note: "追記" } }

        expect(response).to have_http_status(:ok)
      end
    end

    context "取消済み請求書の場合" do
      let!(:canceled_invoice) do
        create(:invoice, :canceled, tenant: tenant, customer: customer, title: "取消済み")
      end

      it "更新できない" do
        patch "/admin/invoices/#{canceled_invoice.id}", params: { invoice: { title: "変更" } }

        expect(response).to have_http_status(:unprocessable_entity)
        expect(json_response["error"]).to include("取消済み")
      end
    end
  end

  describe "POST /admin/invoices/:id/issue" do
    before { sign_in admin_user }

    let!(:draft_invoice) do
      inv = create(:invoice, tenant: tenant, customer: customer)
      create(:invoice_item, :product, invoice: inv, quantity: 1, unit_price: 10_000)
      inv
    end

    it "請求書を発行できる" do
      post "/admin/invoices/#{draft_invoice.id}/issue"

      expect(response).to have_http_status(:ok)
      expect(json_response["invoice"]["status"]).to eq("issued")
      expect(json_response["invoice"]["invoice_number"]).to be_present
      expect(json_response["invoice"]["issued_at"]).to be_present
    end

    it "請求書番号が自動採番される" do
      post "/admin/invoices/#{draft_invoice.id}/issue"

      expect(response).to have_http_status(:ok)
      expect(json_response["invoice"]["invoice_number"]).to match(/INV-\d{4}-\d{3}/)
    end

    context "発行済み請求書の場合" do
      let!(:issued_invoice) do
        create(:invoice, :issued, tenant: tenant, customer: customer)
      end

      it "発行できない" do
        post "/admin/invoices/#{issued_invoice.id}/issue"

        expect(response).to have_http_status(:unprocessable_entity)
        expect(json_response["error"]).to include("下書き状態")
      end
    end
  end

  describe "POST /admin/invoices/:id/cancel" do
    before { sign_in admin_user }

    context "下書き請求書の場合" do
      let!(:draft_invoice) do
        create(:invoice, tenant: tenant, customer: customer, status: :draft)
      end

      it "取消できる" do
        post "/admin/invoices/#{draft_invoice.id}/cancel"

        expect(response).to have_http_status(:ok)
        expect(json_response["invoice"]["status"]).to eq("canceled")
      end
    end

    context "発行済み請求書の場合" do
      let!(:issued_invoice) do
        create(:invoice, :issued, tenant: tenant, customer: customer)
      end

      it "取消できる" do
        post "/admin/invoices/#{issued_invoice.id}/cancel"

        expect(response).to have_http_status(:ok)
        expect(json_response["invoice"]["status"]).to eq("canceled")
      end
    end

    context "取消済み請求書の場合" do
      let!(:canceled_invoice) do
        create(:invoice, :canceled, tenant: tenant, customer: customer)
      end

      it "取消できない" do
        post "/admin/invoices/#{canceled_invoice.id}/cancel"

        expect(response).to have_http_status(:unprocessable_entity)
        expect(json_response["error"]).to include("取消済み")
      end
    end
  end

  describe "POST /admin/invoices/:id/copy" do
    before { sign_in admin_user }

    let!(:original_invoice) do
      inv = create(:invoice, :issued, tenant: tenant, customer: customer, site: site, title: "元の請求書")
      create(:invoice_item, :product, invoice: inv, name: "製品A", quantity: 2, unit_price: 1000)
      inv
    end

    it "請求書をコピーできる" do
      expect do
        post "/admin/invoices/#{original_invoice.id}/copy"
      end.to change(Invoice, :count).by(1)

      expect(response).to have_http_status(:created)
      expect(json_response["invoice"]["status"]).to eq("draft")
      expect(json_response["invoice"]["invoice_number"]).to be_nil
      expect(json_response["invoice"]["title"]).to eq("元の請求書")
    end

    it "請求項目もコピーされる" do
      post "/admin/invoices/#{original_invoice.id}/copy"

      expect(response).to have_http_status(:created)
      expect(json_response["invoice_items"].length).to eq(1)
      expect(json_response["invoice_items"].first["name"]).to eq("製品A")
    end

    context "取消済み請求書の場合" do
      let!(:canceled_invoice) do
        create(:invoice, :canceled, tenant: tenant, customer: customer, title: "取消済み請求書")
      end

      it "コピーできる" do
        post "/admin/invoices/#{canceled_invoice.id}/copy"

        expect(response).to have_http_status(:created)
        expect(json_response["invoice"]["status"]).to eq("draft")
      end
    end
  end

  describe "テナント分離" do
    before { sign_in admin_user }

    let(:other_tenant) { create(:tenant) }
    let(:other_customer) { create(:customer, tenant: other_tenant) }
    let!(:other_invoice) do
      create(:invoice, tenant: other_tenant, customer: other_customer)
    end

    it "他テナントの請求書は取得できない" do
      get "/admin/invoices/#{other_invoice.id}"

      expect(response).to have_http_status(:not_found)
    end
  end
end
