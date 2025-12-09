require "rails_helper"

RSpec.describe "Admin::BankAccounts", type: :request do
  let_it_be(:tenant) { create(:tenant) }
  let_it_be(:admin_user) { create(:user, :admin, tenant: tenant) }
  let_it_be(:member_user) { create(:user, :member, tenant: tenant) }

  describe "GET /admin/bank_accounts" do
    context "管理者の場合" do
      before { sign_in admin_user }

      let!(:bank_account1) { create(:bank_account, tenant: tenant, bank_name: "みずほ銀行") }
      let!(:bank_account2) { create(:bank_account, :default, tenant: tenant, bank_name: "三井住友銀行") }
      let!(:discarded_account) { create(:bank_account, :discarded, tenant: tenant, bank_name: "削除済み口座") }

      it "口座一覧を返す（削除済み除外）" do
        get "/admin/bank_accounts"

        expect(response).to have_http_status(:ok)
        expect(json_response["bank_accounts"].length).to eq(2)
      end

      it "削除済みを含めて取得できる" do
        get "/admin/bank_accounts", params: { show_discarded: "true" }

        expect(response).to have_http_status(:ok)
        expect(json_response["bank_accounts"].length).to eq(3)
      end

      it "口座番号がマスキングされている" do
        get "/admin/bank_accounts"

        expect(response).to have_http_status(:ok)
        account = json_response["bank_accounts"].first
        expect(account["account_number"]).to start_with("****")
      end

      it "デフォルト口座が先頭に来る" do
        get "/admin/bank_accounts"

        expect(response).to have_http_status(:ok)
        expect(json_response["bank_accounts"].first["is_default_for_invoice"]).to be true
      end
    end

    context "一般ユーザーの場合" do
      before { sign_in member_user }

      it "403を返す" do
        get "/admin/bank_accounts"

        expect(response).to have_http_status(:forbidden)
      end
    end
  end

  describe "GET /admin/bank_accounts/:id" do
    before { sign_in admin_user }

    let!(:bank_account) { create(:bank_account, tenant: tenant, account_number: "1234567") }

    it "口座詳細を返す" do
      get "/admin/bank_accounts/#{bank_account.id}"

      expect(response).to have_http_status(:ok)
      expect(json_response["bank_account"]["id"]).to eq(bank_account.id)
    end

    it "詳細では口座番号がマスキングされていない" do
      get "/admin/bank_accounts/#{bank_account.id}"

      expect(response).to have_http_status(:ok)
      expect(json_response["bank_account"]["account_number"]).to eq("1234567")
    end

    it "存在しない口座の場合は404" do
      get "/admin/bank_accounts/00000000-0000-0000-0000-000000000000"

      expect(response).to have_http_status(:not_found)
    end
  end

  describe "POST /admin/bank_accounts" do
    before { sign_in admin_user }

    let(:valid_params) do
      {
        bank_account: {
          bank_name: "新銀行",
          branch_name: "新支店",
          account_type: "ordinary",
          account_number: "9876543",
          account_holder: "カ）テストカイシャ",
        },
      }
    end

    it "口座を作成できる" do
      expect do
        post "/admin/bank_accounts", params: valid_params
      end.to change(BankAccount, :count).by(1)

      expect(response).to have_http_status(:created)
      expect(json_response["bank_account"]["bank_name"]).to eq("新銀行")
    end

    it "銀行名が空の場合はエラー" do
      post "/admin/bank_accounts", params: {
        bank_account: valid_params[:bank_account].merge(bank_name: ""),
      }

      expect(response).to have_http_status(:unprocessable_entity)
    end
  end

  describe "PATCH /admin/bank_accounts/:id" do
    before { sign_in admin_user }

    let!(:bank_account) { create(:bank_account, tenant: tenant, bank_name: "変更前銀行") }

    it "口座を更新できる" do
      patch "/admin/bank_accounts/#{bank_account.id}", params: { bank_account: { bank_name: "変更後銀行" } }

      expect(response).to have_http_status(:ok)
      expect(json_response["bank_account"]["bank_name"]).to eq("変更後銀行")
    end

    context "デフォルト口座設定" do
      let!(:existing_default) { create(:bank_account, :default, tenant: tenant) }

      it "デフォルト設定すると他の口座のデフォルトが解除される" do
        patch "/admin/bank_accounts/#{bank_account.id}", params: {
          bank_account: { is_default_for_invoice: true },
        }

        expect(response).to have_http_status(:ok)
        expect(json_response["bank_account"]["is_default_for_invoice"]).to be true
        expect(existing_default.reload.is_default_for_invoice).to be false
      end
    end
  end

  describe "DELETE /admin/bank_accounts/:id" do
    before { sign_in admin_user }

    let!(:bank_account) { create(:bank_account, tenant: tenant) }

    it "口座を論理削除できる" do
      delete "/admin/bank_accounts/#{bank_account.id}"

      expect(response).to have_http_status(:no_content)
      expect(bank_account.reload.discarded?).to be true
    end
  end
end
