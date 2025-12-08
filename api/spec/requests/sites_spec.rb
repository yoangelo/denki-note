require 'rails_helper'

RSpec.describe 'Sites', type: :request do
  let_it_be(:tenant) { create(:tenant) }
  let_it_be(:user) { create(:user, tenant: tenant) }
  let_it_be(:customer) { create(:customer, tenant: tenant) }

  before { sign_in user }

  describe 'GET /sites' do
    context '認証済みの場合' do
      let!(:site1) { create(:site, tenant: tenant, customer: customer, name: '現場A') }
      let!(:site2) { create(:site, tenant: tenant, customer: customer, name: '現場B') }
      let!(:other_customer_site) { create(:site, tenant: tenant, name: '他顧客現場') }

      it '指定顧客の現場一覧を返す' do
        get '/sites', params: { customer_id: customer.id }

        expect(response).to have_http_status(:ok)
        expect(json_response.length).to eq(2)
        names = json_response.map { |s| s['name'] }
        expect(names).to include('現場A', '現場B')
        expect(names).not_to include('他顧客現場')
      end

      it 'クエリで検索できる' do
        get '/sites', params: { customer_id: customer.id, query: '現場A' }

        expect(response).to have_http_status(:ok)
        expect(json_response.length).to eq(1)
        expect(json_response.first['name']).to eq('現場A')
      end
    end
  end

  describe 'POST /sites' do
    context '認証済みの場合' do
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
          post '/sites', params: valid_params
        }.to change(Site, :count).by(1)

        expect(response).to have_http_status(:created)
        expect(json_response['name']).to eq('新規現場')
      end

      it '名前が空の場合はエラー' do
        post '/sites', params: { site: { customer_id: customer.id, name: '' } }

        expect(response.status).to be >= 400
      end
    end
  end
end
