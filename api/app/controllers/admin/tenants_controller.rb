class Admin::TenantsController < AuthenticatedController
  before_action :require_admin

  # GET /admin/tenant
  def show
    tenant = current_tenant
    tenant_setting = tenant.tenant_setting

    render json: {
      tenant: {
        id: tenant.id,
        name: tenant.name,
        default_unit_rate: tenant_setting&.default_unit_rate,
        money_rounding: tenant_setting&.money_rounding,
        created_at: tenant.created_at,
        updated_at: tenant.updated_at
      }
    }
  end

  # PATCH /admin/tenant
  def update
    tenant = current_tenant
    tenant_setting = tenant.tenant_setting || tenant.build_tenant_setting

    ActiveRecord::Base.transaction do
      # テナント基本情報の更新
      if tenant_params.key?(:name)
        unless tenant.update(name: tenant_params[:name])
          render json: { errors: tenant.errors.messages }, status: :unprocessable_entity
          raise ActiveRecord::Rollback
        end
      end

      # 業務設定の更新
      setting_params = tenant_params.slice(:default_unit_rate, :money_rounding)
      if setting_params.present?
        unless tenant_setting.update(setting_params)
          render json: { errors: tenant_setting.errors.messages }, status: :unprocessable_entity
          raise ActiveRecord::Rollback
        end
      end

      render json: {
        tenant: {
          id: tenant.id,
          name: tenant.name,
          default_unit_rate: tenant_setting.default_unit_rate,
          money_rounding: tenant_setting.money_rounding,
          created_at: tenant.created_at,
          updated_at: tenant.updated_at
        }
      }
    end
  end

  private

  def tenant_params
    params.require(:tenant).permit(:name, :default_unit_rate, :money_rounding)
  end

  def require_admin
    unless current_user&.has_role?(:admin)
      render json: { error: "この操作を実行する権限がありません" }, status: :forbidden
    end
  end
end
