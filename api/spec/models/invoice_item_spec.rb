# frozen_string_literal: true

# == Schema Information
#
# Table name: invoice_items
#
#  id                                                           :uuid             not null, primary key
#  amount(金額（数量×単価、headerの場合はNULL）)                :decimal(12, )
#  item_type(項目タイプ（header/product/material/labor/other）) :string           not null
#  name(名称（コピー値、手動編集可）)                           :string           not null
#  note(備考)                                                   :text
#  quantity(数量（headerの場合はNULL）)                         :decimal(10, 2)
#  sort_order(表示順)                                           :integer          default(0), not null
#  unit(単位（式、個、m、時間等）)                              :string
#  unit_price(単価（コピー値、headerの場合はNULL）)             :decimal(12, )
#  created_at                                                   :datetime         not null
#  updated_at                                                   :datetime         not null
#  invoice_id(請求書ID)                                         :uuid             not null
#
# Indexes
#
#  index_invoice_items_on_invoice_id                 (invoice_id)
#  index_invoice_items_on_invoice_id_and_sort_order  (invoice_id,sort_order)
#  index_invoice_items_on_item_type                  (item_type)
#
# Foreign Keys
#
#  fk_rails_...  (invoice_id => invoices.id) ON DELETE => cascade
#
require "rails_helper"

RSpec.describe InvoiceItem do
  let(:tenant) { create(:tenant) }
  let(:customer) { create(:customer, tenant: tenant) }
  let(:invoice) { create(:invoice, :draft, tenant: tenant, customer: customer) }

  describe "validations" do
    subject { build(:invoice_item, invoice: invoice, item_type: :product, name: "商品", quantity: 1, unit_price: 1000) }

    it { is_expected.to be_valid }

    context "when item_type is blank" do
      before { subject.item_type = nil }

      it { is_expected.not_to be_valid }
    end

    context "when name is blank" do
      before { subject.name = nil }

      it { is_expected.not_to be_valid }
    end

    context "when quantity is negative" do
      before { subject.quantity = -1 }

      it { is_expected.not_to be_valid }
    end

    context "when quantity is zero" do
      before { subject.quantity = 0 }

      it { is_expected.not_to be_valid }
    end

    context "when quantity is nil" do
      before { subject.quantity = nil }

      it { is_expected.to be_valid }
    end

    context "when unit_price is negative" do
      before { subject.unit_price = -1 }

      it { is_expected.not_to be_valid }
    end

    context "when unit_price is nil" do
      before { subject.unit_price = nil }

      it { is_expected.to be_valid }
    end
  end

  describe "#calculate_amount" do
    context "with product item" do
      subject do
        create(:invoice_item, invoice: invoice, item_type: :product, name: "商品",
                              quantity: 3, unit_price: 500)
      end

      it "calculates amount as quantity * unit_price" do
        expect(subject.amount).to eq(1500)
      end
    end

    context "with decimal quantity" do
      subject do
        create(:invoice_item, invoice: invoice, item_type: :product, name: "商品",
                              quantity: 1.5, unit_price: 1000)
      end

      it "calculates amount correctly" do
        expect(subject.amount).to eq(1500)
      end
    end

    context "with header item" do
      subject do
        create(:invoice_item, invoice: invoice, item_type: :header, name: "見出し",
                              quantity: nil, unit_price: nil, amount: nil)
      end

      it "does not calculate amount" do
        expect(subject.amount).to be_nil
      end
    end

    context "when quantity is nil" do
      subject do
        create(:invoice_item, invoice: invoice, item_type: :product, name: "商品",
                              quantity: nil, unit_price: 1000, amount: nil)
      end

      it "does not calculate amount" do
        expect(subject.amount).to be_nil
      end
    end

    context "when unit_price is nil" do
      subject do
        create(:invoice_item, invoice: invoice, item_type: :product, name: "商品",
                              quantity: 1, unit_price: nil, amount: nil)
      end

      it "does not calculate amount" do
        expect(subject.amount).to be_nil
      end
    end

    context "on update" do
      subject do
        create(:invoice_item, invoice: invoice, item_type: :product, name: "商品",
                              quantity: 2, unit_price: 1000)
      end

      it "recalculates amount when quantity changes" do
        subject.update!(quantity: 5)
        expect(subject.amount).to eq(5000)
      end

      it "recalculates amount when unit_price changes" do
        subject.update!(unit_price: 2000)
        expect(subject.amount).to eq(4000)
      end
    end
  end

  describe "#header?" do
    context "when item_type is header" do
      subject { build(:invoice_item, invoice: invoice, item_type: :header, name: "見出し") }

      it { is_expected.to be_header }
    end

    context "when item_type is product" do
      subject { build(:invoice_item, invoice: invoice, item_type: :product, name: "商品") }

      it { is_expected.not_to be_header }
    end

    context "when item_type is labor" do
      subject { build(:invoice_item, invoice: invoice, item_type: :labor, name: "作業") }

      it { is_expected.not_to be_header }
    end
  end

  describe "item_type enum" do
    it "supports header type" do
      item = build(:invoice_item, invoice: invoice, item_type: :header, name: "見出し")
      expect(item.header?).to be true
    end

    it "supports product type" do
      item = build(:invoice_item, invoice: invoice, item_type: :product, name: "商品")
      expect(item.product?).to be true
    end

    it "supports material type" do
      item = build(:invoice_item, invoice: invoice, item_type: :material, name: "資材")
      expect(item.material?).to be true
    end

    it "supports labor type" do
      item = build(:invoice_item, invoice: invoice, item_type: :labor, name: "作業")
      expect(item.labor?).to be true
    end

    it "supports other type" do
      item = build(:invoice_item, invoice: invoice, item_type: :other, name: "その他")
      expect(item.other?).to be true
    end

    it "supports integrated type" do
      item = build(:invoice_item, invoice: invoice, item_type: :integrated, name: "工事一式")
      expect(item.integrated?).to be true
    end
  end

  describe "default_scope" do
    before do
      create(:invoice_item, invoice: invoice, item_type: :product, name: "商品C", sort_order: 3)
      create(:invoice_item, invoice: invoice, item_type: :product, name: "商品A", sort_order: 1)
      create(:invoice_item, invoice: invoice, item_type: :product, name: "商品B", sort_order: 2)
    end

    it "orders by sort_order ascending" do
      items = invoice.reload.invoice_items
      expect(items.pluck(:name)).to eq(["商品A", "商品B", "商品C"])
    end
  end

  describe "associations" do
    it "belongs to invoice" do
      item = create(:invoice_item, invoice: invoice, item_type: :product, name: "商品")
      expect(item.invoice).to eq(invoice)
    end
  end
end
