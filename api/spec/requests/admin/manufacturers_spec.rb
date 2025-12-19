require "rails_helper"

RSpec.describe "Admin::Manufacturers", type: :request do
  let_it_be(:tenant) { create(:tenant) }
  let_it_be(:admin_user) { create(:user, :admin, tenant: tenant) }
  let_it_be(:member_user) { create(:user, :member, tenant: tenant) }

  describe "GET /admin/manufacturers" do
    context "管理者の場合" do
      before { sign_in admin_user }

      let!(:manufacturer1) { create(:manufacturer) }
      let!(:manufacturer2) { create(:manufacturer) }
      let!(:discarded_manufacturer) { create(:manufacturer, :discarded) }

      it "メーカー一覧を返す（削除済み除外）" do
        get "/admin/manufacturers"

        expect(response).to have_http_status(:ok)
        manufacturer_ids = json_response["manufacturers"].pluck("id")
        expect(manufacturer_ids).to include(manufacturer1.id, manufacturer2.id)
        expect(manufacturer_ids).not_to include(discarded_manufacturer.id)
      end

      it "キーワードで検索できる" do
        get "/admin/manufacturers", params: { keyword: manufacturer1.name }

        expect(response).to have_http_status(:ok)
        expect(json_response["manufacturers"].length).to eq(1)
        expect(json_response["manufacturers"].first["name"]).to eq(manufacturer1.name)
      end

      it "メーカー名でソートされる" do
        get "/admin/manufacturers"

        expect(response).to have_http_status(:ok)
        names = json_response["manufacturers"].pluck("name")
        expect(names).to eq(names.sort)
      end
    end

    context "一般ユーザーの場合" do
      before { sign_in member_user }

      it "403を返す" do
        get "/admin/manufacturers"

        expect(response).to have_http_status(:forbidden)
      end
    end
  end
end
