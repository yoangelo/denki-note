require "rails_helper"

RSpec.describe "Admin::Products", type: :request do
  let_it_be(:tenant) { create(:tenant) }
  let_it_be(:admin_user) { create(:user, :admin, tenant: tenant) }
  let_it_be(:member_user) { create(:user, :member, tenant: tenant) }

  describe "GET /admin/products" do
    context "管理者の場合" do
      before { sign_in admin_user }

      let!(:manufacturer) { create(:manufacturer) }
      let!(:product1) { create(:product, tenant: tenant, name: "製品A", model_number: "ABC-001") }
      let!(:product2) do
        create(:product, tenant: tenant, name: "製品B", manufacturer: manufacturer, model_number: "DEF-002")
      end
      let!(:discarded_product) { create(:product, :discarded, tenant: tenant, name: "削除済み製品") }

      it "製品一覧を返す（削除済み除外）" do
        get "/admin/products"

        expect(response).to have_http_status(:ok)
        expect(json_response["products"].length).to eq(2)
        expect(json_response["meta"]["total_count"]).to eq(2)
      end

      it "削除済みを含めて取得できる" do
        get "/admin/products", params: { show_discarded: "true" }

        expect(response).to have_http_status(:ok)
        expect(json_response["products"].length).to eq(3)
      end

      it "キーワードで検索できる（製品名）" do
        get "/admin/products", params: { keyword: "製品A" }

        expect(response).to have_http_status(:ok)
        expect(json_response["products"].length).to eq(1)
        expect(json_response["products"].first["name"]).to eq("製品A")
      end

      it "キーワードで検索できる（型番）" do
        get "/admin/products", params: { keyword: "DEF-002" }

        expect(response).to have_http_status(:ok)
        expect(json_response["products"].length).to eq(1)
        expect(json_response["products"].first["model_number"]).to eq("DEF-002")
      end

      it "メーカーIDで絞り込みできる" do
        get "/admin/products", params: { manufacturer_id: manufacturer.id }

        expect(response).to have_http_status(:ok)
        expect(json_response["products"].length).to eq(1)
        expect(json_response["products"].first["manufacturer_id"]).to eq(manufacturer.id)
      end

      it "メーカー名を含む" do
        get "/admin/products"

        product_with_manufacturer = json_response["products"].find { |p| p["manufacturer_id"] == manufacturer.id }
        expect(product_with_manufacturer["manufacturer_name"]).to eq(manufacturer.name)
      end

      it "ページネーションが動作する" do
        get "/admin/products", params: { page: 1, per_page: 1 }

        expect(response).to have_http_status(:ok)
        expect(json_response["products"].length).to eq(1)
        expect(json_response["meta"]["total_pages"]).to eq(2)
        expect(json_response["meta"]["current_page"]).to eq(1)
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

    let!(:product) { create(:product, tenant: tenant, name: "テスト製品") }

    it "製品詳細を返す" do
      get "/admin/products/#{product.id}"

      expect(response).to have_http_status(:ok)
      expect(json_response["product"]["id"]).to eq(product.id)
      expect(json_response["product"]["name"]).to eq("テスト製品")
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
          name: "新規製品",
          model_number: "NEW-001",
          unit: "台",
          unit_price: 10_000,
        },
      }
    end

    it "製品を作成できる" do
      expect do
        post "/admin/products", params: valid_params
      end.to change(Product, :count).by(1)

      expect(response).to have_http_status(:created)
      expect(json_response["product"]["name"]).to eq("新規製品")
    end

    it "メーカー名を指定すると自動登録される" do
      expect do
        post "/admin/products", params: valid_params.deep_merge(product: { manufacturer_name: "新規メーカー" })
      end.to change(Manufacturer, :count).by(1)

      expect(response).to have_http_status(:created)
      expect(json_response["product"]["manufacturer_name"]).to eq("新規メーカー")
    end

    it "既存のメーカー名を指定するとfind_or_createで紐付けられる" do
      existing_manufacturer = create(:manufacturer, name: "既存メーカー")

      expect do
        post "/admin/products", params: valid_params.deep_merge(product: { manufacturer_name: "既存メーカー" })
      end.not_to change(Manufacturer, :count)

      expect(response).to have_http_status(:created)
      expect(json_response["product"]["manufacturer_id"]).to eq(existing_manufacturer.id)
    end

    it "製品名が空の場合はエラー" do
      post "/admin/products", params: { product: { name: "" } }

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

    it "メーカーを新規に指定できる" do
      patch "/admin/products/#{product.id}", params: { product: { manufacturer_name: "新メーカー" } }

      expect(response).to have_http_status(:ok)
      expect(json_response["product"]["manufacturer_name"]).to eq("新メーカー")
    end

    it "メーカーをクリアできる" do
      product.update!(manufacturer: create(:manufacturer))

      patch "/admin/products/#{product.id}", params: { product: { manufacturer_name: "" } }

      expect(response).to have_http_status(:ok)
      expect(json_response["product"]["manufacturer_id"]).to be_nil
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
