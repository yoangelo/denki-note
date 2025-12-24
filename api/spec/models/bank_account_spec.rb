# frozen_string_literal: true

# == Schema Information
#
# Table name: bank_accounts
#
#  id                                                   :uuid             not null, primary key
#  account_holder(口座名義（暗号化）)                   :string           not null
#  account_number(口座番号（暗号化）)                   :string           not null
#  account_type(口座種別（ordinary/current/savings）)   :string           not null
#  bank_name(銀行名)                                    :string           not null
#  branch_name(支店名)                                  :string           not null
#  discarded_at(削除日時（論理削除）)                   :datetime
#  is_default_for_invoice(請求書用デフォルト口座フラグ) :boolean          default(FALSE), not null
#  created_at                                           :datetime         not null
#  updated_at                                           :datetime         not null
#  tenant_id(自社ID)                                    :uuid             not null
#
# Indexes
#
#  index_bank_accounts_on_discarded_at  (discarded_at)
#  index_bank_accounts_on_tenant_id     (tenant_id)
#
# Foreign Keys
#
#  fk_rails_...  (tenant_id => tenants.id)
#
require "rails_helper"

RSpec.describe BankAccount do
  let(:tenant) { create(:tenant) }

  describe "validations" do
    subject do
      build(:bank_account, tenant: tenant,
                           bank_name: "テスト銀行",
                           branch_name: "テスト支店",
                           account_type: :ordinary,
                           account_number: "1234567",
                           account_holder: "テスト名義")
    end

    it { is_expected.to be_valid }

    context "when bank_name is blank" do
      before { subject.bank_name = nil }

      it { is_expected.not_to be_valid }
    end

    context "when branch_name is blank" do
      before { subject.branch_name = nil }

      it { is_expected.not_to be_valid }
    end

    context "when account_type is blank" do
      before { subject.account_type = nil }

      it { is_expected.not_to be_valid }
    end

    context "when account_number is blank" do
      before { subject.account_number = nil }

      it { is_expected.not_to be_valid }
    end

    context "when account_holder is blank" do
      before { subject.account_holder = nil }

      it { is_expected.not_to be_valid }
    end
  end

  describe "encryption" do
    let(:bank_account) do
      create(:bank_account, tenant: tenant,
                            account_number: "1234567",
                            account_holder: "テスト名義")
    end

    it "encrypts account_number" do
      raw_value = described_class.connection.select_value(
        "SELECT account_number FROM bank_accounts WHERE id = '#{bank_account.id}'"
      )
      expect(raw_value).not_to eq("1234567")
    end

    it "encrypts account_holder" do
      raw_value = described_class.connection.select_value(
        "SELECT account_holder FROM bank_accounts WHERE id = '#{bank_account.id}'"
      )
      expect(raw_value).not_to eq("テスト名義")
    end

    it "decrypts account_number when accessed" do
      expect(bank_account.account_number).to eq("1234567")
    end

    it "decrypts account_holder when accessed" do
      expect(bank_account.account_holder).to eq("テスト名義")
    end
  end

  describe "#masked_account_number" do
    context "with 7 digit account number" do
      let(:bank_account) { build(:bank_account, tenant: tenant, account_number: "1234567") }

      it "masks all but last 4 digits" do
        expect(bank_account.masked_account_number).to eq("****4567")
      end
    end

    context "with 4 digit account number" do
      let(:bank_account) { build(:bank_account, tenant: tenant, account_number: "1234") }

      it "masks all but last 4 digits" do
        expect(bank_account.masked_account_number).to eq("****1234")
      end
    end

    context "with blank account number" do
      let(:bank_account) { build(:bank_account, tenant: tenant) }

      before { bank_account.account_number = "" }

      it "returns nil" do
        expect(bank_account.masked_account_number).to be_nil
      end
    end
  end

  describe "default account" do
    let!(:account1) { create(:bank_account, tenant: tenant, is_default_for_invoice: true) }
    let!(:account2) { create(:bank_account, tenant: tenant, is_default_for_invoice: false) }

    describe ".default_for_invoice" do
      it "returns only default accounts" do
        expect(tenant.bank_accounts.default_for_invoice).to contain_exactly(account1)
      end
    end

    describe "#ensure_single_default" do
      it "unsets previous default when setting new default" do
        account2.update!(is_default_for_invoice: true)

        expect(account1.reload.is_default_for_invoice).to be false
        expect(account2.reload.is_default_for_invoice).to be true
      end

      it "keeps only one default per tenant" do
        account2.update!(is_default_for_invoice: true)

        expect(tenant.bank_accounts.kept.where(is_default_for_invoice: true).count).to eq(1)
      end

      context "with multiple tenants" do
        let(:other_tenant) { create(:tenant) }
        let!(:other_account) { create(:bank_account, tenant: other_tenant, is_default_for_invoice: true) }

        it "does not affect other tenant's default" do
          account2.update!(is_default_for_invoice: true)

          expect(other_account.reload.is_default_for_invoice).to be true
        end
      end
    end
  end

  describe "account_type enum" do
    it "supports ordinary type" do
      account = build(:bank_account, tenant: tenant, account_type: :ordinary)
      expect(account.ordinary?).to be true
    end

    it "supports current type" do
      account = build(:bank_account, tenant: tenant, account_type: :current)
      expect(account.current?).to be true
    end

    it "supports savings type" do
      account = build(:bank_account, tenant: tenant, account_type: :savings)
      expect(account.savings?).to be true
    end
  end

  describe "discard" do
    let!(:account) { create(:bank_account, tenant: tenant) }

    it "supports logical deletion" do
      expect { account.discard }.to change { described_class.kept.count }.by(-1)
    end

    it "can be restored" do
      account.discard
      expect { account.undiscard }.to change { described_class.kept.count }.by(1)
    end

    context "when discarded default account" do
      let!(:default_account) { create(:bank_account, tenant: tenant, is_default_for_invoice: true) }

      it "is excluded from kept scope" do
        default_account.discard
        expect(tenant.bank_accounts.kept.default_for_invoice).to be_empty
      end
    end
  end
end
