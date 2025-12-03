# == Schema Information
#
# Table name: users
#
#  id(ID)                                             :uuid             not null, primary key
#  current_sign_in_at(現在のログイン日時)             :datetime
#  current_sign_in_ip(現在のログインIP)               :string
#  display_name(表示名)                               :string           not null
#  email(メールアドレス)                              :string           default(""), not null
#  encrypted_password(暗号化パスワード)               :string           default(""), not null
#  invitation_accepted_at(招待受諾日時)               :datetime
#  invitation_created_at(招待作成日時)                :datetime
#  invitation_limit(招待可能数)                       :integer
#  invitation_sent_at(招待送信日時)                   :datetime
#  invitation_token(招待トークン)                     :string
#  invitations_count(招待数)                          :integer          default(0)
#  invited_by_type(招待者タイプ)                      :string
#  is_active(有効フラグ)                              :boolean          default(TRUE), not null
#  last_sign_in_at(前回のログイン日時)                :datetime
#  last_sign_in_ip(前回のログインIP)                  :string
#  remember_created_at(ログイン記憶日時)              :datetime
#  reset_password_sent_at(パスワードリセット送信日時) :datetime
#  reset_password_token(パスワードリセットトークン)   :string
#  sign_in_count(ログイン回数)                        :integer          default(0), not null
#  created_at(作成日時)                               :datetime         not null
#  updated_at(更新日時)                               :datetime         not null
#  invited_by_id(招待者ID)                            :bigint
#  tenant_id(テナントID)                              :uuid             not null
#
# Indexes
#
#  index_users_on_email                       (email) UNIQUE
#  index_users_on_invitation_token            (invitation_token) UNIQUE
#  index_users_on_invitations_count           (invitations_count)
#  index_users_on_invited_by                  (invited_by_type,invited_by_id)
#  index_users_on_invited_by_id               (invited_by_id)
#  index_users_on_reset_password_token        (reset_password_token) UNIQUE
#  index_users_on_tenant_id                   (tenant_id)
#  index_users_on_tenant_id_and_display_name  (tenant_id,display_name)
#
# Foreign Keys
#
#  fk_rails_...  (tenant_id => tenants.id)
#
class UserSerializer
  include JSONAPI::Serializer

  attributes :id, :email, :display_name, :is_active, :tenant_id, :created_at

  attribute :roles do |user|
    user.roles.pluck(:name)
  end

  attribute :is_admin do |user|
    user.admin?
  end

  attribute :is_member do |user|
    user.member?
  end
end
