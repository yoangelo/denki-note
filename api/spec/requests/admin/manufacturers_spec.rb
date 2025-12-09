require "rails_helper"

RSpec.describe "Admin::Manufacturers", type: :request do
  let_it_be(:tenant) { create(:tenant) }
  let_it_be(:admin_user) { create(:user, :admin, tenant: tenant) }
  let_it_be(:member_user) { create(:user, :member, tenant: tenant) }

  describe "GET /admin/manufacturers" do
    context "管理者の場合" do
      before { sign_in admin_user }

      let!(:manufacturer1) { create(:manufacturer, name: "パナソニック") }
      let!(:manufacturer2) { create(:manufacturer, name: "三菱電機") }
      let!(:manufacturer3) { create(:manufacturer, name: "ダイキン") }
      let!(:discarded_manufacturer) { create(:manufacturer, :discarded, name: "削除済みメーカー") }

      it "メーカー一覧を返す（削除済み除外）" do
        get "/admin/manufacturers"

        expect(response).to have_http_status(:ok)
        expect(json_response["manufacturers"].length).to eq(3)
      end

      it "検索できる" do
        get "/admin/manufacturers", params: { search: "パナ" }

        expect(response).to have_http_status(:ok)
        expect(json_response["manufacturers"].length).to eq(1)
        expect(json_response["manufacturers"].first["name"]).to eq("パナソニック")
      end

      it "名前順でソートされる" do
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
