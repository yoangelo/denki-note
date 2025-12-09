require 'rails_helper'

RSpec.describe 'Admin::Sites', type: :request do
  let_it_be(:tenant) { create(:tenant) }
  let_it_be(:admin_user) { create(:user, :admin, tenant: tenant) }
  let_it_be(:member_user) { create(:user, :member, tenant: tenant) }
  let_it_be(:customer) { create(:customer, tenant: tenant) }

  describe 'POST /admin/sites' do
    context '管理者の場合' do
      before { sign_in admin_user }

      let(:valid_params) do
        {
          site: {
            customer_id: customer.id,
            name: '新規現場',
            note: 'メモ'
          }
        }
      end

      it '現場を作成できる' do
        expect {
          post '/admin/sites', params: valid_params
        }.to change(Site, :count).by(1)

        expect(response).to have_http_status(:created)
        expect(json_response['site']['name']).to eq('新規現場')
      end

      it '顧客が存在しない場合は404' do
        post '/admin/sites', params: { site: { customer_id: '00000000-0000-0000-0000-000000000000', name: '現場' } }

        expect(response).to have_http_status(:not_found)
      end
    end

    context '一般ユーザーの場合' do
      before { sign_in member_user }

      it '403を返す' do
        post '/admin/sites', params: { site: { customer_id: customer.id, name: '現場' } }

        expect(response).to have_http_status(:forbidden)
      end
    end
  end

  describe 'PATCH /admin/sites/:id' do
    before { sign_in admin_user }

    let!(:site) { create(:site, tenant: tenant, customer: customer, name: '変更前') }

    it '現場を更新できる' do
      patch "/admin/sites/#{site.id}", params: { site: { name: '変更後' } }

      expect(response).to have_http_status(:ok)
      expect(json_response['site']['name']).to eq('変更後')
    end

    it '存在しない現場の場合は404' do
      patch '/admin/sites/00000000-0000-0000-0000-000000000000', params: { site: { name: '変更後' } }

      expect(response).to have_http_status(:not_found)
    end
  end

  describe 'DELETE /admin/sites/:id' do
    before { sign_in admin_user }

    let!(:site) { create(:site, tenant: tenant, customer: customer) }

    it '現場を論理削除できる' do
      delete "/admin/sites/#{site.id}"

      expect(response).to have_http_status(:no_content)
      expect(site.reload.discarded?).to be true
    end
  end
end
