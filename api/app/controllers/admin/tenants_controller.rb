class Admin::TenantsController < AuthenticatedController
  before_action :require_admin

  # GET /admin/tenant
  def show
    tenant = current_tenant
    tenant_setting = tenant.tenant_setting

    render json: {
      tenant: tenant_json(tenant, tenant_setting),
    }
  end

  # PATCH /admin/tenant
  def update
    tenant = current_tenant
    tenant_setting = tenant.tenant_setting || tenant.build_tenant_setting

    ActiveRecord::Base.transaction do
      # テナント基本情報の更新
      tenant_update_params = tenant_params.slice(:name, :postal_code, :address, :phone_number,
                                                 :fax_number, :corporate_number, :representative_name)
      if tenant_update_params.present? && !tenant.update(tenant_update_params)
        render json: { errors: tenant.errors.messages }, status: :unprocessable_entity
        raise ActiveRecord::Rollback
      end

      # 業務設定の更新
      # 存在しない場合は新規作成
      setting_params = tenant_params.slice(:default_unit_rate, :money_rounding)
      if setting_params.present? && !tenant_setting.update(setting_params)
        render json: { errors: tenant_setting.errors.messages }, status: :unprocessable_entity
        raise ActiveRecord::Rollback
      end

      render json: {
        tenant: tenant_json(tenant, tenant_setting),
      }
    end
  end

  private

  def tenant_json(tenant, tenant_setting)
    {
      id: tenant.id,
      name: tenant.name,
      postal_code: tenant.postal_code,
      address: tenant.address,
      phone_number: tenant.phone_number,
      fax_number: tenant.fax_number,
      corporate_number: tenant.corporate_number,
      representative_name: tenant.representative_name,
      default_unit_rate: tenant_setting&.default_unit_rate,
      money_rounding: tenant_setting&.money_rounding,
      created_at: tenant.created_at,
      updated_at: tenant.updated_at,
    }
  end

  def tenant_params
    params.require(:tenant).permit(:name, :postal_code, :address, :phone_number,
                                   :fax_number, :corporate_number, :representative_name,
                                   :default_unit_rate, :money_rounding)
  end

  def require_admin
    return if current_user&.has_role?(:admin)

    render json: { error: "この操作を実行する権限がありません" }, status: :forbidden
  end
end
