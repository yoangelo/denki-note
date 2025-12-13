require "rails_helper"

RSpec.describe "Admin::Tenants", type: :request do
  let!(:tenant) { create(:tenant) }
  let!(:admin_user) { create(:user, :admin, tenant: tenant) }
  let!(:member_user) { create(:user, :member, tenant: tenant) }
  let!(:tenant_setting) do
    create(:tenant_setting, tenant: tenant, default_unit_rate: 3000, money_rounding: "round")
  end

  describe "GET /admin/tenant" do
    context "管理者の場合" do
      before { sign_in admin_user }

      it "テナント情報を返す" do
        get "/admin/tenant"

        expect(response).to have_http_status(:ok)
        expect(json_response["tenant"]["name"]).to eq(tenant.name)
        expect(json_response["tenant"]["default_unit_rate"]).to eq(3000)
        expect(json_response["tenant"]["money_rounding"]).to eq("round")
      end
    end

    context "一般ユーザーの場合" do
      before { sign_in member_user }

      it "403を返す" do
        get "/admin/tenant"

        expect(response).to have_http_status(:forbidden)
      end
    end
  end

  describe "PATCH /admin/tenant" do
    context "管理者の場合" do
      before { sign_in admin_user }

      it "テナント名を更新できる" do
        patch "/admin/tenant", params: { tenant: { name: "更新後会社名" } }

        expect(response).to have_http_status(:ok)
        expect(json_response["tenant"]["name"]).to eq("更新後会社名")
      end

      it "業務設定を更新できる" do
        patch "/admin/tenant", params: { tenant: { default_unit_rate: 5000, money_rounding: "ceil" } }

        expect(response).to have_http_status(:ok)
        expect(json_response["tenant"]["default_unit_rate"]).to eq(5000)
        expect(json_response["tenant"]["money_rounding"]).to eq("ceil")
      end

      it "不正な丸め方式の場合はエラー" do
        patch "/admin/tenant", params: { tenant: { money_rounding: "invalid" } }

        expect(response).to have_http_status(:unprocessable_entity)
      end
    end

    context "一般ユーザーの場合" do
      before { sign_in member_user }

      it "403を返す" do
        patch "/admin/tenant", params: { tenant: { name: "更新" } }

        expect(response).to have_http_status(:forbidden)
      end
    end
  end
end
