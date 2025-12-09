require "rails_helper"

RSpec.describe "Admin::Products", type: :request do
  let_it_be(:tenant) { create(:tenant) }
  let_it_be(:admin_user) { create(:user, :admin, tenant: tenant) }
  let_it_be(:member_user) { create(:user, :member, tenant: tenant) }

  describe "GET /admin/products" do
    context "管理者の場合" do
      before { sign_in admin_user }

      let!(:manufacturer) { create(:manufacturer, name: "パナソニック") }
      let!(:product1) { create(:product, tenant: tenant, manufacturer: manufacturer, name: "エアコン") }
      let!(:product2) { create(:product, tenant: tenant, name: "照明器具") }
      let!(:discarded_product) { create(:product, :discarded, tenant: tenant, name: "削除済み製品") }

      it "製品一覧を返す（削除済み除外）" do
        get "/admin/products"

        expect(response).to have_http_status(:ok)
        expect(json_response["products"].length).to eq(2)
      end

      it "削除済みを含めて取得できる" do
        get "/admin/products", params: { show_discarded: "true" }

        expect(response).to have_http_status(:ok)
        expect(json_response["products"].length).to eq(3)
      end

      it "検索できる" do
        get "/admin/products", params: { search: "エアコン" }

        expect(response).to have_http_status(:ok)
        expect(json_response["products"].length).to eq(1)
        expect(json_response["products"].first["name"]).to eq("エアコン")
      end

      it "メーカー情報を含む" do
        get "/admin/products"

        expect(response).to have_http_status(:ok)
        product_with_manufacturer = json_response["products"].find { |p| p["name"] == "エアコン" }
        expect(product_with_manufacturer["manufacturer"]["name"]).to eq("パナソニック")
      end
    end

    context "一般ユーザーの場合" do
      before { sign_in member_user }

      it "403を返す" do
        get "/admin/products"

        expect(response).to have_http_status(:forbidden)
      end
    end
  end

  describe "GET /admin/products/:id" do
    before { sign_in admin_user }

    let!(:manufacturer) { create(:manufacturer, name: "パナソニック") }
    let!(:product) { create(:product, tenant: tenant, manufacturer: manufacturer, name: "エアコン") }

    it "製品詳細を返す" do
      get "/admin/products/#{product.id}"

      expect(response).to have_http_status(:ok)
      expect(json_response["product"]["id"]).to eq(product.id)
      expect(json_response["product"]["manufacturer"]["name"]).to eq("パナソニック")
    end

    it "存在しない製品の場合は404" do
      get "/admin/products/00000000-0000-0000-0000-000000000000"

      expect(response).to have_http_status(:not_found)
    end
  end

  describe "POST /admin/products" do
    before { sign_in admin_user }

    let(:valid_params) do
      {
        product: {
          name: "新製品",
          model_number: "MODEL-001",
          unit: "台",
          unit_price: 50_000,
        },
        manufacturer_name: "新メーカー",
      }
    end

    it "製品を作成できる" do
      expect do
        post "/admin/products", params: valid_params
      end.to change(Product, :count).by(1)

      expect(response).to have_http_status(:created)
      expect(json_response["product"]["name"]).to eq("新製品")
    end

    it "メーカーが自動登録される" do
      expect do
        post "/admin/products", params: valid_params
      end.to change(Manufacturer, :count).by(1)

      expect(Manufacturer.find_by(name: "新メーカー")).to be_present
    end

    it "既存メーカーは重複登録されない" do
      create(:manufacturer, name: "新メーカー")

      expect do
        post "/admin/products", params: valid_params
      end.not_to change(Manufacturer, :count)
    end

    it "製品名が空の場合はエラー" do
      post "/admin/products", params: { product: { name: "", unit_price: 1000 } }

      expect(response).to have_http_status(:unprocessable_entity)
    end
  end

  describe "PATCH /admin/products/:id" do
    before { sign_in admin_user }

    let!(:product) { create(:product, tenant: tenant, name: "変更前") }

    it "製品を更新できる" do
      patch "/admin/products/#{product.id}", params: { product: { name: "変更後" } }

      expect(response).to have_http_status(:ok)
      expect(json_response["product"]["name"]).to eq("変更後")
    end

    it "メーカーを変更できる" do
      patch "/admin/products/#{product.id}", params: { product: { name: product.name }, manufacturer_name: "変更後メーカー" }

      expect(response).to have_http_status(:ok)
      expect(json_response["product"]["manufacturer"]["name"]).to eq("変更後メーカー")
    end
  end

  describe "DELETE /admin/products/:id" do
    before { sign_in admin_user }

    let!(:product) { create(:product, tenant: tenant) }

    it "製品を論理削除できる" do
      delete "/admin/products/#{product.id}"

      expect(response).to have_http_status(:no_content)
      expect(product.reload.discarded?).to be true
    end
  end
end
