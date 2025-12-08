require 'rails_helper'

RSpec.describe 'Admin::Customers', type: :request do
  let_it_be(:tenant) { create(:tenant) }
  let_it_be(:admin_user) { create(:user, :admin, tenant: tenant) }
  let_it_be(:member_user) { create(:user, :member, tenant: tenant) }

  describe 'GET /admin/customers' do
    context '管理者の場合' do
      before { sign_in admin_user }

      let!(:customer1) { create(:customer, tenant: tenant, name: '顧客A') }
      let!(:customer2) { create(:customer, tenant: tenant, name: '顧客B') }
      let!(:discarded_customer) { create(:customer, :discarded, tenant: tenant, name: '削除済み顧客') }

      it '顧客一覧を返す（削除済み除外）' do
        get '/admin/customers'

        expect(response).to have_http_status(:ok)
        expect(json_response['customers'].length).to eq(2)
      end

      it '削除済みを含めて取得できる' do
        get '/admin/customers', params: { show_discarded: 'true' }

        expect(response).to have_http_status(:ok)
        expect(json_response['customers'].length).to eq(3)
      end

      it '検索できる' do
        get '/admin/customers', params: { search: '顧客A' }

        expect(response).to have_http_status(:ok)
        expect(json_response['customers'].length).to eq(1)
        expect(json_response['customers'].first['name']).to eq('顧客A')
      end
    end

    context '一般ユーザーの場合' do
      before { sign_in member_user }

      it '403を返す' do
        get '/admin/customers'

        expect(response).to have_http_status(:forbidden)
      end
    end
  end

  describe 'GET /admin/customers/check_duplicate' do
    before { sign_in admin_user }

    let!(:existing_customer) { create(:customer, tenant: tenant, name: '既存顧客') }

    it '重複がある場合はtrueを返す' do
      get '/admin/customers/check_duplicate', params: { name: '既存顧客' }

      expect(response).to have_http_status(:ok)
      expect(json_response['duplicate']).to be true
    end

    it '重複がない場合はfalseを返す' do
      get '/admin/customers/check_duplicate', params: { name: '新規顧客' }

      expect(response).to have_http_status(:ok)
      expect(json_response['duplicate']).to be false
    end
  end

  describe 'POST /admin/customers/create_bulk' do
    before { sign_in admin_user }

    let(:valid_params) do
      {
        customer: {
          name: '新規顧客',
          customer_type: 'corporate',
          rate_percent: 100
        },
        sites: [
          { name: '現場1', note: 'メモ1' },
          { name: '現場2', note: 'メモ2' }
        ]
      }
    end

    it '顧客と現場を一括作成できる' do
      expect {
        post '/admin/customers/create_bulk', params: valid_params
      }.to change(Customer, :count).by(1).and change(Site, :count).by(2)

      expect(response).to have_http_status(:created)
      expect(json_response['customer']['name']).to eq('新規顧客')
      expect(json_response['sites'].length).to eq(2)
    end

    it '顧客名が空の場合はエラー' do
      post '/admin/customers/create_bulk', params: { customer: { name: '', customer_type: 'corporate' } }

      expect(response).to have_http_status(:bad_request)
    end
  end

  describe 'GET /admin/customers/:id' do
    before { sign_in admin_user }

    let!(:customer) { create(:customer, tenant: tenant) }
    let!(:site) { create(:site, tenant: tenant, customer: customer) }

    it '顧客詳細を返す' do
      get "/admin/customers/#{customer.id}"

      expect(response).to have_http_status(:ok)
      expect(json_response['customer']['id']).to eq(customer.id)
      expect(json_response['sites'].length).to eq(1)
    end

    it '存在しない顧客の場合は404' do
      get '/admin/customers/00000000-0000-0000-0000-000000000000'

      expect(response).to have_http_status(:not_found)
    end
  end

  describe 'PATCH /admin/customers/:id' do
    before { sign_in admin_user }

    let!(:customer) { create(:customer, tenant: tenant, name: '変更前') }

    it '顧客を更新できる' do
      patch "/admin/customers/#{customer.id}", params: { customer: { name: '変更後' } }

      expect(response).to have_http_status(:ok)
      expect(json_response['customer']['name']).to eq('変更後')
    end
  end

  describe 'DELETE /admin/customers/:id' do
    before { sign_in admin_user }

    let!(:customer) { create(:customer, tenant: tenant) }

    it '顧客を論理削除できる' do
      delete "/admin/customers/#{customer.id}"

      expect(response).to have_http_status(:no_content)
      expect(customer.reload.discarded?).to be true
    end
  end
end
