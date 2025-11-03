# == Schema Information
#
# Table name: users
#
#  id                     :uuid             not null, primary key
#  current_sign_in_at     :datetime
#  current_sign_in_ip     :string
#  display_name           :string           not null
#  email                  :string           default(""), not null
#  encrypted_password     :string           default(""), not null
#  invitation_accepted_at :datetime
#  invitation_created_at  :datetime
#  invitation_limit       :integer
#  invitation_sent_at     :datetime
#  invitation_token       :string
#  invitations_count      :integer          default(0)
#  invited_by_type        :string
#  is_active              :boolean          default(TRUE), not null
#  last_sign_in_at        :datetime
#  last_sign_in_ip        :string
#  remember_created_at    :datetime
#  reset_password_sent_at :datetime
#  reset_password_token   :string
#  sign_in_count          :integer          default(0), not null
#  created_at             :datetime         not null
#  updated_at             :datetime         not null
#  invited_by_id          :bigint
#  tenant_id              :uuid             not null
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
