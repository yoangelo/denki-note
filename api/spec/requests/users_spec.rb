require "rails_helper"

RSpec.describe "Users", type: :request do
  let_it_be(:tenant) { create(:tenant) }
  let_it_be(:user) { create(:user, tenant: tenant) }

  before { sign_in user }

  describe "GET /users" do
    context "認証済みの場合" do
      let!(:other_user) { create(:user, tenant: tenant, display_name: "他のユーザー") }
      let!(:inactive_user) { create(:user, :inactive, tenant: tenant, display_name: "無効ユーザー") }
      let!(:other_tenant_user) { create(:user, display_name: "他テナントユーザー") }

      it "自テナントのユーザー一覧を返す" do
        get "/users"

        expect(response).to have_http_status(:ok)
        names = json_response.pluck("display_name")
        expect(names).to include(user.display_name, "他のユーザー", "無効ユーザー")
        expect(names).not_to include("他テナントユーザー")
      end

      it "is_activeでフィルタリングできる" do
        get "/users", params: { is_active: true }

        expect(response).to have_http_status(:ok)
        expect(json_response.all? { |u| u["is_active"] == true }).to be true
      end
    end

    context "未認証の場合" do
      before { sign_out user }

      it "401を返す" do
        get "/users"

        expect(response).to have_http_status(:unauthorized)
      end
    end
  end
end
