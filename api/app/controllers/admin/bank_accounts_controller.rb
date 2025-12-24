class Admin::BankAccountsController < AuthenticatedController
  before_action :require_admin
  before_action :set_bank_account, only: [:show, :update, :destroy]

  ACCOUNT_TYPE_LABELS = {
    "ordinary" => "普通",
    "current" => "当座",
    "savings" => "貯蓄",
  }.freeze

  # GET /admin/bank_accounts
  def index
    bank_accounts = current_tenant.bank_accounts

    bank_accounts = params[:show_discarded] == "true" ? bank_accounts.with_discarded : bank_accounts.kept

    bank_accounts = bank_accounts.order(is_default_for_invoice: :desc, created_at: :desc)

    render json: {
      bank_accounts: bank_accounts.map { |ba| bank_account_json(ba) },
    }
  end

  # GET /admin/bank_accounts/:id
  def show
    render json: {
      bank_account: bank_account_json(@bank_account, include_full_account_number: true),
    }
  end

  # POST /admin/bank_accounts
  def create
    @bank_account = current_tenant.bank_accounts.build(bank_account_params)

    if @bank_account.save
      render json: { bank_account: bank_account_json(@bank_account) }, status: :created
    else
      render json: { errors: @bank_account.errors.full_messages }, status: :unprocessable_entity
    end
  end

  # PATCH /admin/bank_accounts/:id
  def update
    if @bank_account.update(bank_account_params)
      render json: { bank_account: bank_account_json(@bank_account) }
    else
      render json: { errors: @bank_account.errors.full_messages }, status: :unprocessable_entity
    end
  end

  # DELETE /admin/bank_accounts/:id
  def destroy
    @bank_account.discard
    head :no_content
  end

  private

  def set_bank_account
    @bank_account = current_tenant.bank_accounts.kept.find(params[:id])
  rescue ActiveRecord::RecordNotFound
    render json: { error: "口座情報が見つかりません" }, status: :not_found
  end

  def bank_account_params
    params.require(:bank_account).permit(:bank_name, :branch_name, :account_type, :account_number, :account_holder,
                                         :is_default_for_invoice)
  end

  def bank_account_json(bank_account, include_full_account_number: false)
    json = {
      id: bank_account.id,
      bank_name: bank_account.bank_name,
      branch_name: bank_account.branch_name,
      account_type: bank_account.account_type,
      account_type_label: ACCOUNT_TYPE_LABELS[bank_account.account_type],
      account_number_masked: bank_account.masked_account_number,
      account_holder: bank_account.account_holder,
      is_default_for_invoice: bank_account.is_default_for_invoice,
      discarded_at: bank_account.discarded_at,
      created_at: bank_account.created_at,
      updated_at: bank_account.updated_at,
    }

    json[:account_number] = bank_account.account_number if include_full_account_number

    json
  end

  def require_admin
    return if current_user&.has_role?(:admin)

    render json: { error: "この操作を実行する権限がありません" }, status: :forbidden
  end
end
