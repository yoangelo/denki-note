class WorkEntriesController < ApplicationController
  def bulk
    failed = []
    accepted = 0

    # MVPではテナントIDを固定
    tenant = Tenant.first
    return render json: { error: "Tenant not found" }, status: :unprocessable_entity unless tenant

    ActiveRecord::Base.transaction do
      bulk_params[:entries].each do |entry_params|
        we = WorkEntry.new(
          tenant: tenant,
          daily_report_id: entry_params[:daily_report_id],
          user_id: entry_params[:user_id],
          summary: entry_params[:summary].to_s[0,200],
          minutes: entry_params[:minutes].to_i,
          client_entry_id: entry_params[:client_entry_id]
        )
        if we.save
          accepted += 1
        else
          failed << { client_entry_id: we.client_entry_id, reason: we.errors.full_messages.to_sentence }
        end
      end
    end

    render json: { accepted: accepted, failed: failed }
  end

  private

  def bulk_params
    params.permit(:client_batch_id, entries: [:client_entry_id, :daily_report_id, :user_id, :summary, :minutes])
  end
end