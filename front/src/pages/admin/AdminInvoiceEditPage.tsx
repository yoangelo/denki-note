import { useState, useMemo, useCallback, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import {
  useAdminGetInvoice,
  useAdminUpdateInvoice,
  useAdminIssueInvoice,
  getAdminListInvoicesQueryKey,
  getAdminGetInvoiceQueryKey,
  useAdminGetDailyReportsForInvoice,
} from "../../api/generated/admin/admin";
import { useListCustomers } from "../../api/generated/customers/customers";
import { useListSites } from "../../api/generated/sites/sites";
import type {
  DailyReportForInvoice,
  InvoiceUpdateRequestInvoiceItemsItem,
  InvoiceUpdateRequestInvoiceItemsItemItemType,
} from "../../api/generated/timesheetAPI.schemas";
import { InvoiceStatusBadge } from "../../components/InvoiceStatusBadge";
import {
  Button,
  Input,
  Select,
  Modal,
  ConfirmModal,
  PageHeader,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "../../components/ui";
import { formatCurrency, formatDate } from "../../utils";

type ItemType = InvoiceUpdateRequestInvoiceItemsItemItemType;

type InvoiceItem = {
  id: string;
  item_type: ItemType;
  name: string;
  quantity: number | null;
  unit: string;
  unit_price: number | null;
  amount: number;
  sort_order: number;
  source_product_id?: string;
  source_material_id?: string;
  isNew?: boolean;
};

const ITEM_TYPE_LABELS: Record<ItemType, string> = {
  header: "見出し",
  product: "製品",
  material: "資材",
  labor: "作業",
  other: "その他",
};

const TAX_RATE_OPTIONS = [
  { value: "0.1", label: "10%" },
  { value: "0.08", label: "8%" },
];

export function AdminInvoiceEditPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();

  // Load existing invoice
  const { data, isLoading, error } = useAdminGetInvoice(id || "");

  // Customer/Site selection
  const [customerId, setCustomerId] = useState("");
  const [siteId, setSiteId] = useState("");
  const [showCustomerModal, setShowCustomerModal] = useState(false);

  // Basic info
  const [billingDate, setBillingDate] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [title, setTitle] = useState("");
  const [taxRate, setTaxRate] = useState("0.1");
  const [showOtherInfo, setShowOtherInfo] = useState(false);
  const [deliveryDate, setDeliveryDate] = useState("");
  const [deliveryPlace, setDeliveryPlace] = useState("");
  const [transactionMethod, setTransactionMethod] = useState("");
  const [validUntil, setValidUntil] = useState("");
  const [note, setNote] = useState("");

  // Daily reports
  const [selectedDailyReportIds, setSelectedDailyReportIds] = useState<string[]>([]);
  const [showDailyReportModal, setShowDailyReportModal] = useState(false);
  const [showAutoGenerateModal, setShowAutoGenerateModal] = useState(false);
  const [generatePattern, setGeneratePattern] = useState<"per_report" | "aggregated">("per_report");

  // Invoice items
  const [items, setItems] = useState<InvoiceItem[]>([]);

  // Modals
  const [showIssueConfirmModal, setShowIssueConfirmModal] = useState(false);

  // Initialized flag to prevent re-initialization
  const [initialized, setInitialized] = useState(false);

  // API
  const { data: customers = [] } = useListCustomers();
  const { data: sites = [] } = useListSites(
    customerId ? { customer_id: customerId } : { customer_id: "" }
  );

  const { data: dailyReportsData } = useAdminGetDailyReportsForInvoice(
    customerId
      ? {
          customer_id: customerId,
          site_id: siteId || undefined,
        }
      : { customer_id: "" }
  );
  const dailyReports = useMemo(
    () => dailyReportsData?.daily_reports || [],
    [dailyReportsData?.daily_reports]
  );

  // Initialize form with existing data
  useEffect(() => {
    if (data && !initialized) {
      const { invoice, invoice_items, daily_reports } = data;

      setCustomerId(invoice.customer_id || "");
      setSiteId(invoice.site_id || "");
      setBillingDate(invoice.billing_date || "");
      setCustomerName(invoice.customer_name || "");
      setTitle(invoice.title || "");
      setTaxRate(String(invoice.tax_rate || 0.1));
      setDeliveryDate(invoice.delivery_date || "");
      setDeliveryPlace(invoice.delivery_place || "");
      setTransactionMethod(invoice.transaction_method || "");
      setValidUntil(invoice.valid_until || "");
      setNote(invoice.note || "");

      // Set invoice items
      if (invoice_items) {
        setItems(
          invoice_items.map((item) => ({
            id: item.id,
            item_type: item.item_type as ItemType,
            name: item.name,
            quantity: item.quantity ?? null,
            unit: item.unit || "",
            unit_price: item.unit_price ?? null,
            amount: item.amount || 0,
            sort_order: item.sort_order,
            source_product_id: item.source_product_id || undefined,
            source_material_id: item.source_material_id || undefined,
          }))
        );
      }

      // Set selected daily report IDs
      if (daily_reports) {
        setSelectedDailyReportIds(daily_reports.map((r) => r.id));
      }

      // Show other info if any optional field is filled
      if (
        invoice.delivery_date ||
        invoice.delivery_place ||
        invoice.transaction_method ||
        invoice.valid_until
      ) {
        setShowOtherInfo(true);
      }

      setInitialized(true);
    }
  }, [data, initialized]);

  const updateMutation = useAdminUpdateInvoice({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getAdminListInvoicesQueryKey() });
        queryClient.invalidateQueries({ queryKey: getAdminGetInvoiceQueryKey(id || "") });
        toast.success("請求書を保存しました");
        navigate(`/admin/invoices/${id}`);
      },
      onError: () => {
        toast.error("請求書の保存に失敗しました");
      },
    },
  });

  const issueMutation = useAdminIssueInvoice({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getAdminListInvoicesQueryKey() });
        queryClient.invalidateQueries({ queryKey: getAdminGetInvoiceQueryKey(id || "") });
        toast.success("請求書を発行しました");
        navigate(`/admin/invoices/${id}`);
      },
      onError: () => {
        toast.error("請求書の発行に失敗しました");
      },
    },
  });

  // Calculate amounts
  const subtotal = useMemo(() => {
    return items.reduce((sum, item) => {
      if (item.item_type === "header") return sum;
      return sum + item.amount;
    }, 0);
  }, [items]);

  const taxAmount = useMemo(() => {
    return Math.floor(subtotal * parseFloat(taxRate));
  }, [subtotal, taxRate]);

  const totalAmount = subtotal + taxAmount;

  // Handlers
  const handleCustomerSelect = (cId: string) => {
    const customer = customers.find((c) => c.id === cId);
    setCustomerId(cId);
    setSiteId("");
    setSelectedDailyReportIds([]);
    if (customer) {
      setCustomerName(customer.name);
    }
    setShowCustomerModal(false);
  };

  const handleSiteSelect = (sId: string) => {
    setSiteId(sId);
    setSelectedDailyReportIds([]);
  };

  const handleAddItem = () => {
    const newItem: InvoiceItem = {
      id: crypto.randomUUID(),
      item_type: "other",
      name: "",
      quantity: 1,
      unit: "",
      unit_price: 0,
      amount: 0,
      sort_order: items.length,
      isNew: true,
    };
    setItems([...items, newItem]);
  };

  const handleUpdateItem = (itemId: string, updates: Partial<InvoiceItem>) => {
    setItems(
      items.map((item) => {
        if (item.id !== itemId) return item;
        const updated = { ...item, ...updates };
        // Recalculate amount if quantity or unit_price changed
        if (
          updated.item_type !== "header" &&
          updated.item_type !== "labor" &&
          updated.quantity !== null &&
          updated.unit_price !== null
        ) {
          updated.amount = updated.quantity * updated.unit_price;
        }
        return updated;
      })
    );
  };

  const handleDeleteItem = (itemId: string) => {
    setItems(items.filter((item) => item.id !== itemId));
  };

  const handleDailyReportToggle = (reportId: string) => {
    setSelectedDailyReportIds((prev) =>
      prev.includes(reportId) ? prev.filter((rid) => rid !== reportId) : [...prev, reportId]
    );
  };

  const handleGenerateFromDailyReports = useCallback(() => {
    const selectedReports = dailyReports.filter((r) => selectedDailyReportIds.includes(r.id));
    if (selectedReports.length === 0) {
      toast.error("日報を選択してください");
      return;
    }

    const newItems: InvoiceItem[] = [];
    let sortOrder = items.length;

    if (generatePattern === "per_report") {
      // Per-report pattern: Create items grouped by daily report
      selectedReports.forEach((report) => {
        // Add labor item for this report
        newItems.push({
          id: crypto.randomUUID(),
          item_type: "labor",
          name: `${formatDate(report.report_date)} ${report.summary || "作業"}`,
          quantity: 1,
          unit: "式",
          unit_price: null,
          amount: report.labor_cost,
          sort_order: sortOrder++,
          isNew: true,
        });

        // Add products
        report.products?.forEach((product) => {
          newItems.push({
            id: crypto.randomUUID(),
            item_type: "product",
            name: product.name || "",
            quantity: product.quantity || 1,
            unit: product.unit || "個",
            unit_price: product.unit_price || 0,
            amount: (product.quantity || 1) * (product.unit_price || 0),
            sort_order: sortOrder++,
            source_product_id: product.id,
            isNew: true,
          });
        });

        // Add materials
        report.materials?.forEach((material) => {
          newItems.push({
            id: crypto.randomUUID(),
            item_type: "material",
            name: material.name || "",
            quantity: material.quantity || 1,
            unit: material.unit || "個",
            unit_price: material.unit_price || 0,
            amount: (material.quantity || 1) * (material.unit_price || 0),
            sort_order: sortOrder++,
            source_material_id: material.id,
            isNew: true,
          });
        });
      });
    } else {
      // Aggregated pattern: Combine all items
      const totalLaborCost = selectedReports.reduce((sum, r) => sum + r.labor_cost, 0);

      // Add combined labor item
      newItems.push({
        id: crypto.randomUUID(),
        item_type: "labor",
        name: "作業",
        quantity: 1,
        unit: "式",
        unit_price: null,
        amount: totalLaborCost,
        sort_order: sortOrder++,
        isNew: true,
      });

      // Aggregate products by product_id
      const productMap = new Map<
        string,
        { name: string; quantity: number; unit: string; unit_price: number; id?: string }
      >();
      selectedReports.forEach((report) => {
        report.products?.forEach((product) => {
          const key = product.id || product.name || "";
          const existing = productMap.get(key);
          if (existing) {
            existing.quantity += product.quantity || 1;
          } else {
            productMap.set(key, {
              name: product.name || "",
              quantity: product.quantity || 1,
              unit: product.unit || "個",
              unit_price: product.unit_price || 0,
              id: product.id,
            });
          }
        });
      });

      productMap.forEach((product) => {
        newItems.push({
          id: crypto.randomUUID(),
          item_type: "product",
          name: product.name,
          quantity: product.quantity,
          unit: product.unit,
          unit_price: product.unit_price,
          amount: product.quantity * product.unit_price,
          sort_order: sortOrder++,
          source_product_id: product.id,
          isNew: true,
        });
      });

      // Aggregate materials by material_id
      const materialMap = new Map<
        string,
        { name: string; quantity: number; unit: string; unit_price: number; id?: string }
      >();
      selectedReports.forEach((report) => {
        report.materials?.forEach((material) => {
          const key = material.id || material.name || "";
          const existing = materialMap.get(key);
          if (existing) {
            existing.quantity += material.quantity || 1;
          } else {
            materialMap.set(key, {
              name: material.name || "",
              quantity: material.quantity || 1,
              unit: material.unit || "個",
              unit_price: material.unit_price || 0,
              id: material.id,
            });
          }
        });
      });

      materialMap.forEach((material) => {
        newItems.push({
          id: crypto.randomUUID(),
          item_type: "material",
          name: material.name,
          quantity: material.quantity,
          unit: material.unit,
          unit_price: material.unit_price,
          amount: material.quantity * material.unit_price,
          sort_order: sortOrder++,
          source_material_id: material.id,
          isNew: true,
        });
      });
    }

    setItems([...items, ...newItems]);
    setShowAutoGenerateModal(false);
    toast.success(`${newItems.length}件の請求項目を追加しました`);
  }, [dailyReports, selectedDailyReportIds, generatePattern, items]);

  const handleSave = () => {
    if (!customerId) {
      toast.error("顧客を選択してください");
      return;
    }
    if (!billingDate) {
      toast.error("請求日を入力してください");
      return;
    }

    const invoiceItems: InvoiceUpdateRequestInvoiceItemsItem[] = items.map((item, index) => ({
      id: item.isNew ? undefined : item.id,
      item_type: item.item_type,
      name: item.name,
      quantity: item.quantity ?? undefined,
      unit: item.unit || undefined,
      unit_price: item.unit_price ?? undefined,
      amount: item.amount,
      sort_order: index,
      source_product_id: item.source_product_id,
      source_material_id: item.source_material_id,
    }));

    updateMutation.mutate({
      id: id || "",
      data: {
        invoice: {
          customer_id: customerId,
          site_id: siteId || undefined,
          billing_date: billingDate,
          customer_name: customerName || undefined,
          title: title || undefined,
          tax_rate: parseFloat(taxRate),
          delivery_date: deliveryDate || undefined,
          delivery_place: deliveryPlace || undefined,
          transaction_method: transactionMethod || undefined,
          valid_until: validUntil || undefined,
          note: note || undefined,
        },
        invoice_items: invoiceItems,
        daily_report_ids: selectedDailyReportIds.length > 0 ? selectedDailyReportIds : undefined,
      },
    });
  };

  const handleIssue = () => {
    if (!customerId) {
      toast.error("顧客を選択してください");
      return;
    }
    if (!billingDate) {
      toast.error("請求日を入力してください");
      return;
    }
    setShowIssueConfirmModal(true);
  };

  const handleConfirmIssue = async () => {
    const invoiceItems: InvoiceUpdateRequestInvoiceItemsItem[] = items.map((item, index) => ({
      id: item.isNew ? undefined : item.id,
      item_type: item.item_type,
      name: item.name,
      quantity: item.quantity ?? undefined,
      unit: item.unit || undefined,
      unit_price: item.unit_price ?? undefined,
      amount: item.amount,
      sort_order: index,
      source_product_id: item.source_product_id,
      source_material_id: item.source_material_id,
    }));

    try {
      await updateMutation.mutateAsync({
        id: id || "",
        data: {
          invoice: {
            customer_id: customerId,
            site_id: siteId || undefined,
            billing_date: billingDate,
            customer_name: customerName || undefined,
            title: title || undefined,
            tax_rate: parseFloat(taxRate),
            delivery_date: deliveryDate || undefined,
            delivery_place: deliveryPlace || undefined,
            transaction_method: transactionMethod || undefined,
            valid_until: validUntil || undefined,
            note: note || undefined,
          },
          invoice_items: invoiceItems,
          daily_report_ids: selectedDailyReportIds.length > 0 ? selectedDailyReportIds : undefined,
        },
      });

      await issueMutation.mutateAsync({ id: id || "" });
    } catch {
      // Error handled by mutation callbacks
    }
    setShowIssueConfirmModal(false);
  };

  const selectedCustomer = customers.find((c) => c.id === customerId);
  const selectedSite = sites.find((s) => s.id === siteId);

  const selectedDailyReportsTotal = useMemo(() => {
    return dailyReports
      .filter((r) => selectedDailyReportIds.includes(r.id))
      .reduce((sum, r) => sum + r.total_amount, 0);
  }, [dailyReports, selectedDailyReportIds]);

  // Loading state
  if (isLoading) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">読み込み中...</p>
      </div>
    );
  }

  // Error state
  if (error || !data) {
    return (
      <div className="text-center py-12">
        <p className="text-red-500">請求書の取得に失敗しました</p>
        <Button className="mt-4" onClick={() => navigate("/admin/invoices")}>
          一覧に戻る
        </Button>
      </div>
    );
  }

  const invoice = data.invoice;
  const canEdit = invoice.status === "draft" || invoice.status === "issued";
  const isDraft = invoice.status === "draft";

  // Check if invoice can be edited
  if (!canEdit) {
    return (
      <div className="text-center py-12">
        <p className="text-red-500">この請求書は編集できません</p>
        <Button className="mt-4" onClick={() => navigate(`/admin/invoices/${id}`)}>
          詳細に戻る
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      <PageHeader title="請求書の編集" action={<InvoiceStatusBadge status={invoice.status} />} />

      {/* Customer/Site Selection */}
      <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-medium">顧客・現場</h2>
          <Button onClick={() => setShowCustomerModal(true)}>変更</Button>
        </div>
        {customerId ? (
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-medium">{selectedCustomer?.name}</span>
              {selectedCustomer?.customer_type === "corporate" && (
                <span className="text-xs px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded">
                  法人
                </span>
              )}
            </div>
            {siteId && <div className="text-sm text-gray-600">現場: {selectedSite?.name}</div>}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">顧客を選択してください</div>
        )}
      </div>

      {/* Main Form - Only show when customer is selected */}
      {customerId && (
        <>
          {/* Two column layout */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Basic Info */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-medium mb-4">基本情報</h2>
              <div className="space-y-4">
                <Input
                  label="日付（請求日）"
                  type="date"
                  value={billingDate}
                  onChange={(e) => setBillingDate(e.target.value)}
                  required
                />
                <Input
                  label="顧客表示名"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  required
                />
                <Input
                  label="タイトル"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="例: 1月分工事代金"
                />

                <button
                  type="button"
                  className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-800"
                  onClick={() => setShowOtherInfo(!showOtherInfo)}
                >
                  <span>{showOtherInfo ? "▼" : "▶"}</span>
                  <span>その他情報</span>
                </button>

                {showOtherInfo && (
                  <div className="space-y-4 pl-4 border-l-2 border-gray-200">
                    <Input
                      label="受渡期日"
                      type="date"
                      value={deliveryDate}
                      onChange={(e) => setDeliveryDate(e.target.value)}
                    />
                    <Input
                      label="受渡場所"
                      value={deliveryPlace}
                      onChange={(e) => setDeliveryPlace(e.target.value)}
                      placeholder="例: ○○工場"
                    />
                    <Input
                      label="取引方法"
                      value={transactionMethod}
                      onChange={(e) => setTransactionMethod(e.target.value)}
                      placeholder="例: 銀行振込"
                    />
                    <Input
                      label="有効期限"
                      type="date"
                      value={validUntil}
                      onChange={(e) => setValidUntil(e.target.value)}
                    />
                  </div>
                )}

                <Select
                  label="税率"
                  value={taxRate}
                  onChange={(e) => setTaxRate(e.target.value)}
                  required
                >
                  {TAX_RATE_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </Select>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">備考</label>
                  <textarea
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={3}
                  />
                </div>
              </div>
            </div>

            {/* Daily Reports */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-medium">関連する日報の設定</h2>
                <Button variant="secondary" onClick={() => setShowDailyReportModal(true)}>
                  日報を選択
                </Button>
              </div>

              {selectedDailyReportIds.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  日報を選択すると、請求項目を自動生成できます
                </div>
              ) : (
                <div className="space-y-3">
                  {dailyReports
                    .filter((r) => selectedDailyReportIds.includes(r.id))
                    .map((report) => (
                      <DailyReportCard
                        key={report.id}
                        report={report}
                        onRemove={() => handleDailyReportToggle(report.id)}
                      />
                    ))}
                  <div className="pt-2 border-t border-gray-200 flex justify-end">
                    <span className="text-sm text-gray-600">
                      合計金額(税込):{" "}
                      <span className="font-bold text-blue-600">
                        {formatCurrency(selectedDailyReportsTotal)}
                      </span>
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Invoice Items */}
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-medium">請求項目</h2>
              <div className="flex gap-2">
                {selectedDailyReportIds.length > 0 && (
                  <Button variant="secondary" onClick={() => setShowAutoGenerateModal(true)}>
                    日報から自動生成
                  </Button>
                )}
                <Button onClick={handleAddItem}>+ 項目追加</Button>
              </div>
            </div>

            {items.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                請求項目がありません。「+ 項目追加」で追加するか、日報から自動生成してください。
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableHead className="w-24">種別</TableHead>
                    <TableHead>品名</TableHead>
                    <TableHead className="w-20" align="right">
                      数量
                    </TableHead>
                    <TableHead className="w-16">単位</TableHead>
                    <TableHead className="w-28" align="right">
                      単価
                    </TableHead>
                    <TableHead className="w-28" align="right">
                      金額
                    </TableHead>
                    <TableHead className="w-12" align="center">
                      削除
                    </TableHead>
                  </TableHeader>
                  <TableBody>
                    {items.map((item) => (
                      <InvoiceItemRow
                        key={item.id}
                        item={item}
                        onUpdate={handleUpdateItem}
                        onDelete={handleDeleteItem}
                      />
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}

            {/* Totals */}
            <div className="mt-4 border-t pt-4">
              <div className="flex justify-end">
                <div className="w-64 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">小計</span>
                    <span className="font-medium">{formatCurrency(subtotal)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">
                      消費税({Math.round(parseFloat(taxRate) * 100)}%)
                    </span>
                    <span className="font-medium">{formatCurrency(taxAmount)}</span>
                  </div>
                  <div className="flex justify-between border-t pt-2">
                    <span className="font-bold">合計</span>
                    <span className="font-bold text-blue-600">{formatCurrency(totalAmount)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex justify-end gap-4">
              <Button variant="secondary" onClick={() => navigate(`/admin/invoices/${id}`)}>
                キャンセル
              </Button>
              <Button variant="secondary" onClick={handleSave} disabled={updateMutation.isPending}>
                {updateMutation.isPending ? "保存中..." : "保存"}
              </Button>
              {isDraft && (
                <Button
                  onClick={handleIssue}
                  disabled={updateMutation.isPending || issueMutation.isPending}
                >
                  発行
                </Button>
              )}
            </div>
          </div>
        </>
      )}

      {/* Customer Selection Modal */}
      <Modal
        isOpen={showCustomerModal}
        onClose={() => setShowCustomerModal(false)}
        title="顧客・現場選択"
        size="lg"
      >
        <div className="space-y-4">
          <Select
            label="顧客"
            value={customerId}
            onChange={(e) => handleCustomerSelect(e.target.value)}
          >
            <option value="">選択してください</option>
            {customers.map((customer) => (
              <option key={customer.id} value={customer.id}>
                {customer.name}
              </option>
            ))}
          </Select>

          {customerId && (
            <Select
              label="現場（任意）"
              value={siteId}
              onChange={(e) => handleSiteSelect(e.target.value)}
            >
              <option value="">選択しない</option>
              {sites.map((site) => (
                <option key={site.id} value={site.id}>
                  {site.name}
                </option>
              ))}
            </Select>
          )}
        </div>
      </Modal>

      {/* Daily Report Selection Modal */}
      <Modal
        isOpen={showDailyReportModal}
        onClose={() => setShowDailyReportModal(false)}
        title="日報選択"
        size="lg"
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowDailyReportModal(false)}>
              キャンセル
            </Button>
            <Button onClick={() => setShowDailyReportModal(false)}>選択</Button>
          </>
        }
      >
        {dailyReports.length === 0 ? (
          <div className="text-center py-8 text-gray-500">該当する日報がありません</div>
        ) : (
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {dailyReports.map((report) => (
              <label
                key={report.id}
                className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer hover:bg-gray-50 ${
                  selectedDailyReportIds.includes(report.id)
                    ? "border-blue-500 bg-blue-50"
                    : "border-gray-200"
                }`}
              >
                <input
                  type="checkbox"
                  checked={selectedDailyReportIds.includes(report.id)}
                  onChange={() => handleDailyReportToggle(report.id)}
                  className="w-4 h-4 text-blue-600 rounded"
                />
                <div className="flex-1">
                  <div className="flex justify-between">
                    <span className="font-medium">{formatDate(report.report_date)}</span>
                    <span className="text-blue-600 font-medium">
                      {formatCurrency(report.total_amount)}
                    </span>
                  </div>
                  <div className="text-sm text-gray-600">{report.summary || "作業"}</div>
                </div>
              </label>
            ))}
          </div>
        )}
        <div className="mt-4 pt-4 border-t flex justify-end">
          <span className="text-sm text-gray-600">
            合計金額(税込):{" "}
            <span className="font-bold text-blue-600">
              {formatCurrency(selectedDailyReportsTotal)}
            </span>
          </span>
        </div>
      </Modal>

      {/* Auto Generate Modal */}
      <Modal
        isOpen={showAutoGenerateModal}
        onClose={() => setShowAutoGenerateModal(false)}
        title="日報から自動生成"
        size="md"
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowAutoGenerateModal(false)}>
              キャンセル
            </Button>
            <Button onClick={handleGenerateFromDailyReports}>生成する</Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="text-sm text-gray-600">
            選択中の日報: {selectedDailyReportIds.length}件
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">生成パターン</label>
            <div className="space-y-2">
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="generatePattern"
                  value="per_report"
                  checked={generatePattern === "per_report"}
                  onChange={() => setGeneratePattern("per_report")}
                  className="w-4 h-4 text-blue-600"
                />
                <span>日報単位</span>
                <span className="text-sm text-gray-500">- 日報ごとに項目を分けて生成</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="generatePattern"
                  value="aggregated"
                  checked={generatePattern === "aggregated"}
                  onChange={() => setGeneratePattern("aggregated")}
                  className="w-4 h-4 text-blue-600"
                />
                <span>集約</span>
                <span className="text-sm text-gray-500">- 同じ製品・資材は合算して生成</span>
              </label>
            </div>
          </div>
        </div>
      </Modal>

      {/* Issue Confirmation Modal */}
      <ConfirmModal
        isOpen={showIssueConfirmModal}
        onClose={() => setShowIssueConfirmModal(false)}
        onConfirm={handleConfirmIssue}
        title="請求書の発行確認"
        message={`この請求書を発行しますか？\n\n顧客: ${customerName}\n合計金額: ${formatCurrency(totalAmount)}`}
        confirmText="発行する"
        loading={updateMutation.isPending || issueMutation.isPending}
      />
    </div>
  );
}

// Sub-components
function DailyReportCard({
  report,
  onRemove,
}: {
  report: DailyReportForInvoice;
  onRemove: () => void;
}) {
  return (
    <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
      <div className="flex justify-between items-start mb-2">
        <div>
          <span className="font-medium">{formatDate(report.report_date)}</span>
          <span className="text-gray-500 ml-2 text-sm">{report.summary}</span>
        </div>
        <button onClick={onRemove} className="text-gray-400 hover:text-red-500">
          ×
        </button>
      </div>
      <div className="text-sm text-gray-600">
        <div>工賃: {formatCurrency(report.labor_cost)}</div>
        {report.products && report.products.length > 0 && (
          <div>製品: {report.products.map((p) => `${p.name}(${p.quantity})`).join(", ")}</div>
        )}
        {report.materials && report.materials.length > 0 && (
          <div>資材: {report.materials.map((m) => `${m.name}(${m.quantity})`).join(", ")}</div>
        )}
      </div>
    </div>
  );
}

function InvoiceItemRow({
  item,
  onUpdate,
  onDelete,
}: {
  item: InvoiceItem;
  onUpdate: (id: string, updates: Partial<InvoiceItem>) => void;
  onDelete: (id: string) => void;
}) {
  const isHeader = item.item_type === "header";
  const isLabor = item.item_type === "labor";

  return (
    <TableRow>
      <TableCell>
        <select
          value={item.item_type}
          onChange={(e) => onUpdate(item.id, { item_type: e.target.value as ItemType })}
          className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
        >
          {Object.entries(ITEM_TYPE_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </TableCell>
      <TableCell>
        <input
          type="text"
          value={item.name}
          onChange={(e) => onUpdate(item.id, { name: e.target.value })}
          className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
          placeholder="品名"
        />
      </TableCell>
      <TableCell align="right">
        {isHeader ? (
          "-"
        ) : isLabor ? (
          "1"
        ) : (
          <input
            type="number"
            value={item.quantity ?? ""}
            onChange={(e) =>
              onUpdate(item.id, { quantity: e.target.value ? parseFloat(e.target.value) : null })
            }
            className="w-full px-2 py-1 border border-gray-300 rounded text-sm text-right"
            min="0"
            step="0.01"
          />
        )}
      </TableCell>
      <TableCell>
        {isHeader ? (
          "-"
        ) : isLabor ? (
          "式"
        ) : (
          <input
            type="text"
            value={item.unit}
            onChange={(e) => onUpdate(item.id, { unit: e.target.value })}
            className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
            placeholder="単位"
          />
        )}
      </TableCell>
      <TableCell align="right">
        {isHeader || isLabor ? (
          "-"
        ) : (
          <input
            type="number"
            value={item.unit_price ?? ""}
            onChange={(e) =>
              onUpdate(item.id, { unit_price: e.target.value ? parseInt(e.target.value) : null })
            }
            className="w-full px-2 py-1 border border-gray-300 rounded text-sm text-right"
            min="0"
          />
        )}
      </TableCell>
      <TableCell align="right">
        {isHeader ? (
          "-"
        ) : isLabor ? (
          <input
            type="number"
            value={item.amount}
            onChange={(e) =>
              onUpdate(item.id, { amount: e.target.value ? parseInt(e.target.value) : 0 })
            }
            className="w-full px-2 py-1 border border-gray-300 rounded text-sm text-right"
            min="0"
          />
        ) : (
          formatCurrency(item.amount)
        )}
      </TableCell>
      <TableCell align="center">
        <button onClick={() => onDelete(item.id)} className="text-red-500 hover:text-red-700">
          <div className="i-heroicons-trash w-4 h-4" />
        </button>
      </TableCell>
    </TableRow>
  );
}
