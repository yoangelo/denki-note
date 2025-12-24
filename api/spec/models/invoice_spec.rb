# frozen_string_literal: true

# == Schema Information
#
# Table name: invoices
#
#  id                                                              :uuid             not null, primary key
#  billing_date                                                    :date             not null
#  created_by(作成者ID)                                            :uuid
#  customer_name(顧客名（コピー値、手動編集可）)                   :string           not null
#  delivery_date(受渡期日)                                         :date
#  delivery_place(受渡場所)                                        :string
#  discarded_at(削除日時（論理削除）)                              :datetime
#  invoice_number(請求書番号（自社内でユニーク、draftではNULL可）) :string
#  issued_at(発行日時)                                             :datetime
#  note(備考)                                                      :text
#  status(ステータス（draft/issued/canceled）)                     :string           default("draft"), not null
#  subtotal(税抜合計金額)                                          :decimal(12, )    default(0), not null
#  tax_amount(消費税額)                                            :decimal(12, )    default(0), not null
#  tax_rate(適用税率（%）)                                         :decimal(4, 2)    default(10.0), not null
#  title(タイトル)                                                 :string
#  total_amount(税込合計金額)                                      :decimal(12, )    default(0), not null
#  transaction_method(取引方法)                                    :string
#  valid_until(有効期限)                                           :date
#  created_at                                                      :datetime         not null
#  updated_at                                                      :datetime         not null
#  customer_id(顧客ID)                                             :uuid             not null
#  site_id(現場ID)                                                 :uuid
#  tenant_id(自社ID)                                               :uuid             not null
#
# Indexes
#
#  index_invoices_on_customer_id                   (customer_id)
#  index_invoices_on_discarded_at                  (discarded_at)
#  index_invoices_on_site_id                       (site_id)
#  index_invoices_on_status                        (status)
#  index_invoices_on_tenant_id                     (tenant_id)
#  index_invoices_on_tenant_id_and_invoice_number  (tenant_id,invoice_number) UNIQUE WHERE (invoice_number IS NOT NULL)
#
# Foreign Keys
#
#  fk_rails_...  (created_by => users.id)
#  fk_rails_...  (customer_id => customers.id)
#  fk_rails_...  (site_id => sites.id)
#  fk_rails_...  (tenant_id => tenants.id)
#
require "rails_helper"

RSpec.describe Invoice do
  include ActiveSupport::Testing::TimeHelpers

  let(:tenant) { create(:tenant) }
  let(:customer) { create(:customer, tenant: tenant) }
  let(:site) { create(:site, customer: customer, tenant: tenant) }

  describe "validations" do
    subject { build(:invoice, tenant: tenant, customer: customer, site: site) }

    it { is_expected.to be_valid }

    context "when customer_id is blank" do
      before { subject.customer_id = nil }

      it { is_expected.not_to be_valid }
    end

    context "when customer_name is blank and customer is nil" do
      subject { build(:invoice, tenant: tenant, customer: nil, customer_id: nil, customer_name: nil) }

      it "is invalid without customer_name" do
        subject.customer_id = customer.id
        subject.customer_name = ""
        expect(subject).not_to be_valid
        expect(subject.errors[:customer_name]).to include("顧客名を入力してください")
      end
    end

    context "when billing_date is blank" do
      before { subject.billing_date = nil }

      it { is_expected.not_to be_valid }
    end

    context "when tax_rate is negative" do
      before { subject.tax_rate = -1 }

      it { is_expected.not_to be_valid }
    end

    context "when tax_rate is greater than 100" do
      before { subject.tax_rate = 101 }

      it { is_expected.not_to be_valid }
    end
  end

  describe "status constraints" do
    context "when status is draft" do
      subject { build(:invoice, :draft, tenant: tenant, customer: customer, issued_at: Time.current) }

      it "is invalid with issued_at" do
        expect(subject).not_to be_valid
        expect(subject.errors[:issued_at]).to include("は下書きでは設定できません")
      end
    end

    context "when status is issued" do
      subject do
        build(:invoice, tenant: tenant, customer: customer).tap do |inv|
          inv.status = :issued
          inv.issued_at = Time.current
        end
      end

      it "is invalid without invoice_number" do
        subject.invoice_number = nil
        expect(subject).not_to be_valid
        expect(subject.errors[:invoice_number]).to include("は必須です")
      end

      it "is invalid without issued_at" do
        subject.issued_at = nil
        expect(subject).not_to be_valid
        expect(subject.errors[:issued_at]).to include("は必須です")
      end

      it "is invalid without invoice items" do
        subject.invoice_number = "INV-2024-001"
        subject.invoice_items = []
        expect(subject).not_to be_valid
        expect(subject.errors[:base]).to include("請求項目が必要です")
      end

      it "is invalid when total_amount is 0" do
        subject.invoice_number = "INV-2024-001"
        subject.invoice_items.build(item_type: :product, name: "商品", quantity: 1, unit_price: 0, amount: 0)
        expect(subject).not_to be_valid
        expect(subject.errors[:total_amount]).to include("は0より大きい値が必要です")
      end
    end
  end

  describe "#calculate_amounts" do
    let(:invoice) { create(:invoice, :draft, tenant: tenant, customer: customer, tax_rate: 10) }

    before do
      invoice.invoice_items.create!(item_type: :product, name: "商品A", quantity: 2, unit_price: 1000, amount: 2000)
      invoice.invoice_items.create!(item_type: :product, name: "商品B", quantity: 1, unit_price: 500, amount: 500)
      invoice.invoice_items.create!(item_type: :header, name: "見出し")
      invoice.save!
    end

    it "calculates subtotal from non-header items" do
      expect(invoice.subtotal).to eq(2500)
    end

    it "calculates tax_amount" do
      expect(invoice.tax_amount).to eq(250)
    end

    it "calculates total_amount" do
      expect(invoice.total_amount).to eq(2750)
    end

    context "with 8% tax rate" do
      before do
        invoice.update!(tax_rate: 8)
      end

      it "calculates tax with 8% rate" do
        expect(invoice.tax_amount).to eq(200)
        expect(invoice.total_amount).to eq(2700)
      end
    end

    context "with floor rounding" do
      let(:invoice) { create(:invoice, :draft, tenant: tenant, customer: customer, tax_rate: 10) }

      before do
        invoice.invoice_items.destroy_all
        invoice.invoice_items.create!(item_type: :product, name: "商品", quantity: 1, unit_price: 999, amount: 999)
        invoice.save!
      end

      it "floors tax amount" do
        expect(invoice.tax_amount).to eq(99)
        expect(invoice.total_amount).to eq(1098)
      end
    end
  end

  describe "#issue" do
    let(:invoice) do
      create(:invoice, :draft, tenant: tenant, customer: customer).tap do |inv|
        inv.invoice_items.create!(item_type: :product, name: "商品", quantity: 1, unit_price: 1000, amount: 1000)
      end
    end

    it "changes status to issued" do
      expect { invoice.issue }.to change { invoice.reload.status }.from("draft").to("issued")
    end

    it "sets issued_at" do
      travel_to Time.zone.local(2024, 1, 1, 12, 0, 0) do
        invoice.issue
        expect(invoice.reload.issued_at).to eq(Time.current)
      end
    end

    it "generates invoice_number" do
      invoice.issue
      expect(invoice.reload.invoice_number).to match(/INV-\d{4}-\d{3}/)
    end

    it "returns true on success" do
      expect(invoice.issue).to be true
    end

    context "when already issued" do
      before { invoice.issue }

      it "returns false" do
        expect(invoice.issue).to be false
      end
    end
  end

  describe "#generate_invoice_number" do
    let(:invoice) do
      create(:invoice, :draft, tenant: tenant, customer: customer).tap do |inv|
        inv.invoice_items.create!(item_type: :product, name: "商品", quantity: 1, unit_price: 1000, amount: 1000)
      end
    end

    it "generates number with current year" do
      invoice.issue
      expect(invoice.invoice_number).to start_with("INV-#{Time.current.year}-")
    end

    it "generates sequential numbers" do
      invoice.issue
      first_number = invoice.invoice_number

      second_invoice = create(:invoice, :draft, tenant: tenant, customer: customer).tap do |inv|
        inv.invoice_items.create!(item_type: :product, name: "商品", quantity: 1, unit_price: 1000, amount: 1000)
      end
      second_invoice.issue

      first_seq = first_number.split("-").last.to_i
      second_seq = second_invoice.invoice_number.split("-").last.to_i
      expect(second_seq).to eq(first_seq + 1)
    end

    it "is unique per tenant" do
      other_tenant = create(:tenant)
      other_customer = create(:customer, tenant: other_tenant)

      invoice.issue

      other_invoice = create(:invoice, :draft, tenant: other_tenant, customer: other_customer).tap do |inv|
        inv.invoice_items.create!(item_type: :product, name: "商品", quantity: 1, unit_price: 1000, amount: 1000)
      end
      other_invoice.issue

      expect(invoice.invoice_number).to eq(other_invoice.invoice_number)
    end
  end

  describe "#cancel" do
    let(:invoice) do
      create(:invoice, :draft, tenant: tenant, customer: customer).tap do |inv|
        inv.invoice_items.create!(item_type: :product, name: "商品", quantity: 1, unit_price: 1000, amount: 1000)
      end
    end

    context "when draft" do
      it "changes status to canceled" do
        expect { invoice.cancel }.to change { invoice.reload.status }.from("draft").to("canceled")
      end

      it "returns true" do
        expect(invoice.cancel).to be true
      end
    end

    context "when issued" do
      before { invoice.issue }

      it "changes status to canceled" do
        expect { invoice.cancel }.to change { invoice.reload.status }.from("issued").to("canceled")
      end
    end

    context "when already canceled" do
      before do
        invoice.cancel
      end

      it "returns false" do
        expect(invoice.cancel).to be false
      end
    end
  end

  describe "#copy_to_new_invoice" do
    subject { invoice.copy_to_new_invoice }

    let(:invoice) do
      create(:invoice, :draft, tenant: tenant, customer: customer, site: site, title: "テスト請求書",
                               tax_rate: 8, note: "備考").tap do |inv|
        inv.invoice_items.create!(item_type: :header, name: "見出し", sort_order: 0)
        inv.invoice_items.create!(item_type: :product, name: "商品A", quantity: 2, unit_price: 1000, amount: 2000,
                                  sort_order: 1)
        inv.issue
      end
    end

    it "creates a draft invoice" do
      expect(subject.status).to eq("draft")
    end

    it "clears invoice_number" do
      expect(subject.invoice_number).to be_nil
    end

    it "clears issued_at" do
      expect(subject.issued_at).to be_nil
    end

    it "sets billing_date to today" do
      expect(subject.billing_date).to eq(Time.zone.today)
    end

    it "copies basic attributes" do
      expect(subject.customer_id).to eq(invoice.customer_id)
      expect(subject.site_id).to eq(invoice.site_id)
      expect(subject.title).to eq(invoice.title)
      expect(subject.tax_rate).to eq(invoice.tax_rate)
      expect(subject.note).to eq(invoice.note)
    end

    it "copies invoice items" do
      expect(subject.invoice_items.size).to eq(2)
      expect(subject.invoice_items.map(&:name)).to contain_exactly("見出し", "商品A")
    end
  end
end
