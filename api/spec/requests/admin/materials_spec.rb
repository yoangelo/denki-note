require "rails_helper"

RSpec.describe "Admin::Materials", type: :request do
  let_it_be(:tenant) { create(:tenant) }
  let_it_be(:admin_user) { create(:user, :admin, tenant: tenant) }
  let_it_be(:member_user) { create(:user, :member, tenant: tenant) }

  describe "GET /admin/materials" do
    context "管理者の場合" do
      before { sign_in admin_user }

      let!(:material1) { create(:material, tenant: tenant, name: "VVFケーブル", material_type: "電線") }
      let!(:material2) { create(:material, tenant: tenant, name: "PF管", material_type: "配管") }
      let!(:discarded_material) { create(:material, :discarded, tenant: tenant, name: "削除済み資材") }

      it "資材一覧を返す（削除済み除外）" do
        get "/admin/materials"

        expect(response).to have_http_status(:ok)
        expect(json_response["materials"].length).to eq(2)
      end

      it "削除済みを含めて取得できる" do
        get "/admin/materials", params: { show_discarded: "true" }

        expect(response).to have_http_status(:ok)
        expect(json_response["materials"].length).to eq(3)
      end

      it "検索できる" do
        get "/admin/materials", params: { search: "VVF" }

        expect(response).to have_http_status(:ok)
        expect(json_response["materials"].length).to eq(1)
        expect(json_response["materials"].first["name"]).to eq("VVFケーブル")
      end

      it "タイプでフィルタリングできる" do
        get "/admin/materials", params: { material_type: "電線" }

        expect(response).to have_http_status(:ok)
        expect(json_response["materials"].length).to eq(1)
        expect(json_response["materials"].first["material_type"]).to eq("電線")
      end
    end

    context "一般ユーザーの場合" do
      before { sign_in member_user }

      it "403を返す" do
        get "/admin/materials"

        expect(response).to have_http_status(:forbidden)
      end
    end
  end

  describe "GET /admin/materials/:id" do
    before { sign_in admin_user }

    let!(:material) { create(:material, tenant: tenant, name: "VVFケーブル") }

    it "資材詳細を返す" do
      get "/admin/materials/#{material.id}"

      expect(response).to have_http_status(:ok)
      expect(json_response["material"]["id"]).to eq(material.id)
      expect(json_response["material"]["name"]).to eq("VVFケーブル")
    end

    it "存在しない資材の場合は404" do
      get "/admin/materials/00000000-0000-0000-0000-000000000000"

      expect(response).to have_http_status(:not_found)
    end
  end

  describe "POST /admin/materials" do
    before { sign_in admin_user }

    let(:valid_params) do
      {
        material: {
          name: "新資材",
          model_number: "MAT-001",
          unit: "m",
          unit_price: 500,
          material_type: "電線",
        },
      }
    end

    it "資材を作成できる" do
      expect do
        post "/admin/materials", params: valid_params
      end.to change(Material, :count).by(1)

      expect(response).to have_http_status(:created)
      expect(json_response["material"]["name"]).to eq("新資材")
    end

    it "資材名が空の場合はエラー" do
      post "/admin/materials", params: { material: { name: "", unit_price: 500 } }

      expect(response).to have_http_status(:unprocessable_entity)
    end
  end

  describe "PATCH /admin/materials/:id" do
    before { sign_in admin_user }

    let!(:material) { create(:material, tenant: tenant, name: "変更前") }

    it "資材を更新できる" do
      patch "/admin/materials/#{material.id}", params: { material: { name: "変更後" } }

      expect(response).to have_http_status(:ok)
      expect(json_response["material"]["name"]).to eq("変更後")
    end
  end

  describe "DELETE /admin/materials/:id" do
    before { sign_in admin_user }

    let!(:material) { create(:material, tenant: tenant) }

    it "資材を論理削除できる" do
      delete "/admin/materials/#{material.id}"

      expect(response).to have_http_status(:no_content)
      expect(material.reload.discarded?).to be true
    end
  end
end
