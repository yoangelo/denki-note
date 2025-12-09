require "rails_helper"

RSpec.describe "DailyReports", type: :request do
  let_it_be(:tenant) { create(:tenant) }
  let_it_be(:user) { create(:user, tenant: tenant) }
  let_it_be(:admin_user) { create(:user, :admin, tenant: tenant) }
  let_it_be(:customer) { create(:customer, tenant: tenant) }
  let_it_be(:site) { create(:site, tenant: tenant, customer: customer) }

  describe "GET /daily_reports" do
    before { sign_in user }

    context "認証済みの場合" do
      let!(:daily_report) do
        create(:daily_report, tenant: tenant, site: site, work_date: Date.new(2024, 1, 15), work_user: user)
      end

      it "日報一覧を返す" do
        get "/daily_reports"

        expect(response).to have_http_status(:ok)
        expect(json_response["daily_reports"].length).to eq(1)
        expect(json_response["meta"]["total_count"]).to eq(1)
      end

      it "year_monthでフィルタリングできる" do
        get "/daily_reports", params: { year_month: "2024-01" }

        expect(response).to have_http_status(:ok)
        expect(json_response["daily_reports"].length).to eq(1)
      end

      it "存在しない月では空を返す" do
        get "/daily_reports", params: { year_month: "2023-01" }

        expect(response).to have_http_status(:ok)
        expect(json_response["daily_reports"].length).to eq(0)
      end
    end
  end

  describe "GET /daily_reports/:id" do
    before { sign_in user }

    let!(:daily_report) { create(:daily_report, tenant: tenant, site: site, work_user: user) }

    it "日報詳細を返す" do
      get "/daily_reports/#{daily_report.id}"

      expect(response).to have_http_status(:ok)
      expect(json_response["daily_report"]["id"]).to eq(daily_report.id)
      expect(json_response["daily_report"]["work_entries"].length).to eq(1)
    end

    it "存在しないIDの場合は404" do
      get "/daily_reports/00000000-0000-0000-0000-000000000000"

      expect(response).to have_http_status(:not_found)
    end

    context "製品・資材がある場合" do
      let!(:product) { create(:product, tenant: tenant, name: "テスト製品") }
      let!(:material) { create(:material, tenant: tenant, name: "テスト資材") }
      let!(:daily_report_product) do
        create(:daily_report_product, daily_report: daily_report, product: product, quantity: 2)
      end
      let!(:daily_report_material) do
        create(:daily_report_material, daily_report: daily_report, material: material, quantity: 5)
      end

      # rubocop:disable RSpec/MultipleExpectations
      it "製品・資材を含めて返す" do
        get "/daily_reports/#{daily_report.id}"

        expect(response).to have_http_status(:ok)
        expect(json_response["daily_report"]["products"].length).to eq(1)
        expect(json_response["daily_report"]["products"].first["product_name"]).to eq("テスト製品")
        expect(json_response["daily_report"]["products"].first["quantity"].to_f).to eq(2.0)
        expect(json_response["daily_report"]["materials"].length).to eq(1)
        expect(json_response["daily_report"]["materials"].first["material_name"]).to eq("テスト資材")
        expect(json_response["daily_report"]["materials"].first["quantity"].to_f).to eq(5.0)
      end
      # rubocop:enable RSpec/MultipleExpectations
    end
  end

  describe "POST /daily_reports/bulk_create" do
    before { sign_in user }

    let(:valid_params) do
      {
        daily_reports: [
          {
            site_id: site.id,
            work_date: Date.current.to_s,
            summary: "テスト作業",
            work_entries: [
              { user_id: user.id, minutes: 60 },
            ],
          },
        ],
      }
    end

    it "日報を一括作成できる" do
      expect do
        post "/daily_reports/bulk_create", params: valid_params
      end.to change(DailyReport, :count).by(1)

      expect(response).to have_http_status(:ok)
      expect(json_response["success"]).to be true
      expect(json_response["summary"]["reports_created"]).to eq(1)
    end

    it "作業エントリがない場合はエラー" do
      invalid_params = {
        daily_reports: [
          {
            site_id: site.id,
            work_date: Date.current.to_s,
            summary: "テスト",
            work_entries: [],
          },
        ],
      }

      post "/daily_reports/bulk_create", params: invalid_params

      expect(json_response["success"]).to be(false).or(be_nil)
    end

    context "製品・資材を含む場合" do
      let!(:product) { create(:product, tenant: tenant) }
      let!(:material) { create(:material, tenant: tenant) }

      let(:params_with_products_and_materials) do
        {
          daily_reports: [
            {
              site_id: site.id,
              work_date: Date.current.to_s,
              summary: "製品・資材を含むテスト",
              work_entries: [
                { user_id: user.id, minutes: 60 },
              ],
              products: [
                { product_id: product.id, quantity: 2 },
              ],
              materials: [
                { material_id: material.id, quantity: 5 },
              ],
            },
          ],
        }
      end

      it "製品・資材も一緒に作成される" do
        expect do
          post "/daily_reports/bulk_create", params: params_with_products_and_materials
        end.to change(DailyReportProduct, :count).by(1)
                                                 .and change(DailyReportMaterial, :count).by(1)

        expect(response).to have_http_status(:ok)
        expect(json_response["success"]).to be true
      end
    end
  end

  describe "PUT /daily_reports/:id/bulk_update" do
    let!(:daily_report) { create(:daily_report, tenant: tenant, site: site, work_user: user) }

    context "管理者の場合" do
      before { sign_in admin_user }

      it "日報を更新できる" do
        put "/daily_reports/#{daily_report.id}/bulk_update", params: {
          daily_report: {
            site_id: site.id,
            summary: "更新後の概要",
            work_entries: [
              { user_id: user.id, minutes: 120 },
            ],
          },
        }

        expect(response).to have_http_status(:ok)
        expect(json_response["daily_report"]["summary"]).to eq("更新後の概要")
      end

      context "製品・資材を更新する場合" do
        let!(:product) { create(:product, tenant: tenant) }
        let!(:material) { create(:material, tenant: tenant) }

        it "製品・資材を追加できる" do
          put "/daily_reports/#{daily_report.id}/bulk_update", params: {
            daily_report: {
              site_id: site.id,
              summary: "製品・資材追加",
              work_entries: [
                { user_id: user.id, minutes: 60 },
              ],
              products: [
                { product_id: product.id, quantity: 3 },
              ],
              materials: [
                { material_id: material.id, quantity: 10 },
              ],
            },
          }

          expect(response).to have_http_status(:ok)
          expect(json_response["daily_report"]["products"].length).to eq(1)
          expect(json_response["daily_report"]["products"].first["quantity"].to_f).to eq(3.0)
          expect(json_response["daily_report"]["materials"].length).to eq(1)
          expect(json_response["daily_report"]["materials"].first["quantity"].to_f).to eq(10.0)
        end
      end
    end

    context "一般ユーザーの場合" do
      before { sign_in user }

      it "403を返す" do
        put "/daily_reports/#{daily_report.id}/bulk_update", params: {
          daily_report: {
            site_id: site.id,
            summary: "更新後の概要",
            work_entries: [
              { user_id: user.id, minutes: 120 },
            ],
          },
        }

        expect(response).to have_http_status(:forbidden)
      end
    end
  end

  describe "DELETE /daily_reports/:id/destroy" do
    let!(:daily_report) { create(:daily_report, tenant: tenant, site: site, work_user: user) }

    context "管理者の場合" do
      before { sign_in admin_user }

      it "日報を削除できる" do
        delete "/daily_reports/#{daily_report.id}/destroy"

        expect(response).to have_http_status(:no_content)
        expect(daily_report.reload.discarded?).to be true
      end
    end

    context "一般ユーザーの場合" do
      before { sign_in user }

      it "403を返す" do
        delete "/daily_reports/#{daily_report.id}/destroy"

        expect(response).to have_http_status(:forbidden)
      end
    end
  end
end
