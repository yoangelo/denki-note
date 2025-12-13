require "rails_helper"

RSpec.describe "Admin::Materials", type: :request do
  let_it_be(:tenant) { create(:tenant) }
  let_it_be(:admin_user) { create(:user, :admin, tenant: tenant) }
  let_it_be(:member_user) { create(:user, :member, tenant: tenant) }

  describe "GET /admin/materials" do
    context "管理者の場合" do
      before { sign_in admin_user }

      let!(:material1) { create(:material, tenant: tenant, name: "資材A", model_number: "MAT-001") }
      let!(:material2) do
        create(:material, tenant: tenant, name: "資材B", material_type: "電線・ケーブル", model_number: "MAT-002")
      end
      let!(:discarded_material) { create(:material, :discarded, tenant: tenant, name: "削除済み資材") }

      it "資材一覧を返す（削除済み除外）" do
        get "/admin/materials"

        expect(response).to have_http_status(:ok)
        expect(json_response["materials"].length).to eq(2)
        expect(json_response["meta"]["total_count"]).to eq(2)
      end

      it "削除済みを含めて取得できる" do
        get "/admin/materials", params: { show_discarded: "true" }

        expect(response).to have_http_status(:ok)
        expect(json_response["materials"].length).to eq(3)
      end

      it "キーワードで検索できる（資材名）" do
        get "/admin/materials", params: { keyword: "資材A" }

        expect(response).to have_http_status(:ok)
        expect(json_response["materials"].length).to eq(1)
        expect(json_response["materials"].first["name"]).to eq("資材A")
      end

      it "キーワードで検索できる（型番）" do
        get "/admin/materials", params: { keyword: "MAT-002" }

        expect(response).to have_http_status(:ok)
        expect(json_response["materials"].length).to eq(1)
        expect(json_response["materials"].first["model_number"]).to eq("MAT-002")
      end

      it "資材タイプで絞り込みできる" do
        get "/admin/materials", params: { material_type: "電線・ケーブル" }

        expect(response).to have_http_status(:ok)
        expect(json_response["materials"].length).to eq(1)
        expect(json_response["materials"].first["material_type"]).to eq("電線・ケーブル")
      end

      it "ページネーションが動作する" do
        get "/admin/materials", params: { page: 1, per_page: 1 }

        expect(response).to have_http_status(:ok)
        expect(json_response["materials"].length).to eq(1)
        expect(json_response["meta"]["total_pages"]).to eq(2)
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

  describe "GET /admin/materials/types" do
    before { sign_in admin_user }

    let!(:material1) { create(:material, tenant: tenant, material_type: "電線・ケーブル") }
    let!(:material2) { create(:material, tenant: tenant, material_type: "配管") }
    let!(:material3) { create(:material, tenant: tenant, material_type: "電線・ケーブル") }
    let!(:material4) { create(:material, tenant: tenant, material_type: nil) }

    it "資材タイプの一覧を返す（重複なし、ソート済み）" do
      get "/admin/materials/types"

      expect(response).to have_http_status(:ok)
      expect(json_response["material_types"]).to eq(["配管", "電線・ケーブル"])
    end
  end

  describe "GET /admin/materials/:id" do
    before { sign_in admin_user }

    let!(:material) { create(:material, tenant: tenant, name: "テスト資材") }

    it "資材詳細を返す" do
      get "/admin/materials/#{material.id}"

      expect(response).to have_http_status(:ok)
      expect(json_response["material"]["id"]).to eq(material.id)
      expect(json_response["material"]["name"]).to eq("テスト資材")
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
          name: "新規資材",
          model_number: "NEW-MAT-001",
          unit: "m",
          unit_price: 100,
          material_type: "電線・ケーブル",
        },
      }
    end

    it "資材を作成できる" do
      expect do
        post "/admin/materials", params: valid_params
      end.to change(Material, :count).by(1)

      expect(response).to have_http_status(:created)
      expect(json_response["material"]["name"]).to eq("新規資材")
      expect(json_response["material"]["material_type"]).to eq("電線・ケーブル")
    end

    it "資材名が空の場合はエラー" do
      post "/admin/materials", params: { material: { name: "" } }

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
