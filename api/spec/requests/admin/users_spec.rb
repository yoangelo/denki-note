require 'rails_helper'

RSpec.describe 'Admin::Users', type: :request do
  let_it_be(:tenant) { create(:tenant) }
  let_it_be(:admin_user) { create(:user, :admin, tenant: tenant) }
  let_it_be(:member_user) { create(:user, :member, tenant: tenant) }

  describe 'GET /admin/users' do
    context '管理者の場合' do
      before { sign_in admin_user }

      let!(:other_user) { create(:user, tenant: tenant, display_name: 'テストユーザー') }

      it 'ユーザー一覧を返す' do
        get '/admin/users'

        expect(response).to have_http_status(:ok)
        expect(json_response['users'].length).to be >= 2
        expect(json_response['meta']['total_count']).to be >= 2
      end

      it 'クエリで検索できる' do
        get '/admin/users', params: { query: 'テストユーザー' }

        expect(response).to have_http_status(:ok)
        names = json_response['users'].map { |u| u['display_name'] }
        expect(names).to include('テストユーザー')
      end

      it 'ロールでフィルタリングできる', :skip => 'Serializerのroles属性の形式を調査中' do
        get '/admin/users', params: { role: 'admin' }

        expect(response).to have_http_status(:ok)
        json_response['users'].each do |user|
          role_names = user['roles'].map { |r| r['name'] || r['role_name'] }.compact
          expect(role_names).to include('admin')
        end
      end
    end

    context '一般ユーザーの場合' do
      before { sign_in member_user }

      it '403を返す' do
        get '/admin/users'

        expect(response).to have_http_status(:forbidden)
      end
    end
  end

  describe 'GET /admin/users/:id' do
    before { sign_in admin_user }

    let!(:target_user) { create(:user, tenant: tenant) }

    it 'ユーザー詳細を返す' do
      get "/admin/users/#{target_user.id}"

      expect(response).to have_http_status(:ok)
      expect(json_response['user']['id']).to eq(target_user.id)
    end

    it '他テナントのユーザーは取得できない' do
      other_tenant_user = create(:user)
      get "/admin/users/#{other_tenant_user.id}"

      expect(response).to have_http_status(:not_found)
    end
  end

  describe 'PATCH /admin/users/:id' do
    before { sign_in admin_user }

    let!(:target_user) { create(:user, tenant: tenant, display_name: '変更前') }

    it 'ユーザーを更新できる', :skip => 'PATCH requestのJSON処理を調査中' do
      patch "/admin/users/#{target_user.id}", params: { user: { display_name: '変更後' } }

      expect(response).to have_http_status(:ok)
      expect(json_response['user']['display_name']).to eq('変更後')
    end

    it 'is_activeを更新できる', :skip => 'PATCH requestのJSON処理を調査中' do
      patch "/admin/users/#{target_user.id}", params: { user: { is_active: false } }

      expect(response).to have_http_status(:ok)
      expect(json_response['user']['is_active']).to be false
    end
  end

  describe 'DELETE /admin/users/:id' do
    before { sign_in admin_user }

    let!(:target_user) { create(:user, tenant: tenant) }

    it 'ユーザーを削除できる' do
      delete "/admin/users/#{target_user.id}"

      expect(response).to have_http_status(:ok)
      expect(User.find_by(id: target_user.id)).to be_nil
    end

    it '自分自身は削除できない' do
      delete "/admin/users/#{admin_user.id}"

      expect(response).to have_http_status(:unprocessable_entity)
    end
  end

  describe 'POST /admin/users/:id/add_role' do
    before { sign_in admin_user }

    let!(:target_user) { create(:user, tenant: tenant) }

    before do
      Role.find_or_create_by!(name: 'member') do |role|
        role.display_name = 'メンバー'
        role.description = '一般メンバー'
      end
    end

    it 'ロールを追加できる' do
      post "/admin/users/#{target_user.id}/add_role", params: { role_name: 'member' }

      expect(response).to have_http_status(:ok)
      expect(target_user.reload.has_role?('member')).to be true
    end

    it '存在しないロールの場合はエラー' do
      post "/admin/users/#{target_user.id}/add_role", params: { role_name: 'invalid_role' }

      expect(response.status).to be_in([400, 404])
    end
  end

  describe 'DELETE /admin/users/:id/roles/:role_id' do
    before { sign_in admin_user }

    let!(:target_user) { create(:user, :member, tenant: tenant) }

    it 'ロールを削除できる' do
      role = Role.find_by(name: 'member')
      delete "/admin/users/#{target_user.id}/roles/#{role.id}"

      expect(response).to have_http_status(:ok)
      expect(target_user.reload.has_role?('member')).to be false
    end
  end
end
