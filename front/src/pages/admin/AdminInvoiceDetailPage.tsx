import { useNavigate, useParams } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import {
  useAdminGetInvoice,
  useAdminCancelInvoice,
  useAdminCopyInvoice,
  getAdminListInvoicesQueryKey,
  getAdminGetInvoiceQueryKey,
} from "../../api/generated/admin/admin";
import { InvoiceStatusBadge } from "../../components/InvoiceStatusBadge";
import {
  Button,
  ConfirmModal,
  PageHeader,
  Card,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  TableEmptyState,
} from "../../components/ui";
import { formatCurrency, formatDate } from "../../utils";
import { useState } from "react";

const ITEM_TYPE_LABELS: Record<string, string> = {
  header: "見出し",
  product: "製品",
  material: "資材",
  labor: "作業",
  other: "その他",
};

export function AdminInvoiceDetailPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();

  const [showCancelModal, setShowCancelModal] = useState(false);

  const { data, isLoading, error } = useAdminGetInvoice(id || "");

  const cancelMutation = useAdminCancelInvoice({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getAdminListInvoicesQueryKey() });
        queryClient.invalidateQueries({ queryKey: getAdminGetInvoiceQueryKey(id || "") });
        toast.success("請求書を取消しました");
        setShowCancelModal(false);
      },
      onError: () => {
        toast.error("請求書の取消に失敗しました");
      },
    },
  });

  const copyMutation = useAdminCopyInvoice({
    mutation: {
      onSuccess: (result) => {
        queryClient.invalidateQueries({ queryKey: getAdminListInvoicesQueryKey() });
        toast.success("請求書をコピーしました");
        if (result.invoice?.id) {
          navigate(`/admin/invoices/${result.invoice.id}/edit`);
        }
      },
      onError: () => {
        toast.error("請求書のコピーに失敗しました");
      },
    },
  });

  if (isLoading) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">読み込み中...</p>
      </div>
    );
  }

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

  const { invoice, invoice_items, daily_reports, bank_account, tenant } = data;
  const canEdit = invoice.status === "draft" || invoice.status === "issued";
  const canCancel = invoice.status === "draft" || invoice.status === "issued";

  const handleCancel = () => {
    if (id) {
      cancelMutation.mutate({ id });
    }
  };

  const handleCopy = () => {
    if (id) {
      copyMutation.mutate({ id });
    }
  };

  return (
    <div className="max-w-6xl mx-auto">
      <PageHeader
        title="請求書詳細"
        action={
          <div className="flex gap-2">
            {canEdit && (
              <Button onClick={() => navigate(`/admin/invoices/${id}/edit`)}>編集</Button>
            )}
            {canCancel && (
              <Button variant="secondary" onClick={() => setShowCancelModal(true)}>
                取消
              </Button>
            )}
            <Button variant="secondary" onClick={handleCopy} disabled={copyMutation.isPending}>
              {copyMutation.isPending ? "コピー中..." : "コピー"}
            </Button>
          </div>
        }
      />

      {/* Status Badge */}
      <div className="mb-6">
        <InvoiceStatusBadge status={invoice.status} />
      </div>

      {/* Basic Info */}
      <Card className="mb-6">
        <h2 className="text-lg font-medium mb-4">基本情報</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <dt className="text-sm text-gray-600">請求書番号</dt>
            <dd className="font-medium">
              {invoice.status === "draft" ? "（下書き）" : invoice.invoice_number || "-"}
            </dd>
          </div>
          <div>
            <dt className="text-sm text-gray-600">顧客</dt>
            <dd className="font-medium">{invoice.customer_name}</dd>
          </div>
          <div>
            <dt className="text-sm text-gray-600">現場</dt>
            <dd className="font-medium">{invoice.site_name || "-"}</dd>
          </div>
          <div>
            <dt className="text-sm text-gray-600">タイトル</dt>
            <dd className="font-medium">{invoice.title || "-"}</dd>
          </div>
          <div>
            <dt className="text-sm text-gray-600">請求日</dt>
            <dd className="font-medium">{formatDate(invoice.billing_date)}</dd>
          </div>
          <div>
            <dt className="text-sm text-gray-600">発行日</dt>
            <dd className="font-medium">{formatDate(invoice.issued_at)}</dd>
          </div>
          {invoice.delivery_date && (
            <div>
              <dt className="text-sm text-gray-600">受渡期日</dt>
              <dd className="font-medium">{formatDate(invoice.delivery_date)}</dd>
            </div>
          )}
          {invoice.delivery_place && (
            <div>
              <dt className="text-sm text-gray-600">受渡場所</dt>
              <dd className="font-medium">{invoice.delivery_place}</dd>
            </div>
          )}
          {invoice.transaction_method && (
            <div>
              <dt className="text-sm text-gray-600">取引方法</dt>
              <dd className="font-medium">{invoice.transaction_method}</dd>
            </div>
          )}
          {invoice.valid_until && (
            <div>
              <dt className="text-sm text-gray-600">有効期限</dt>
              <dd className="font-medium">{formatDate(invoice.valid_until)}</dd>
            </div>
          )}
        </div>
        {invoice.note && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <dt className="text-sm text-gray-600 mb-1">備考</dt>
            <dd className="whitespace-pre-wrap">{invoice.note}</dd>
          </div>
        )}
      </Card>

      {/* Invoice Items */}
      <Card className="mb-6">
        <h2 className="text-lg font-medium mb-4">請求項目</h2>
        {invoice_items.length === 0 ? (
          <div className="text-center py-8 text-gray-500">請求項目がありません</div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableHead>種別</TableHead>
                <TableHead>品名</TableHead>
                <TableHead align="right">数量</TableHead>
                <TableHead>単位</TableHead>
                <TableHead align="right">単価</TableHead>
                <TableHead align="right">金額</TableHead>
              </TableHeader>
              <TableBody>
                {invoice_items
                  .sort((a, b) => a.sort_order - b.sort_order)
                  .map((item) => (
                    <TableRow
                      key={item.id}
                      className={item.item_type === "header" ? "bg-gray-50 font-medium" : ""}
                    >
                      <TableCell>{ITEM_TYPE_LABELS[item.item_type] || item.item_type}</TableCell>
                      <TableCell>{item.name}</TableCell>
                      <TableCell align="right">
                        {item.item_type === "header" ? "-" : (item.quantity ?? "-")}
                      </TableCell>
                      <TableCell>{item.item_type === "header" ? "-" : item.unit || "-"}</TableCell>
                      <TableCell align="right">
                        {item.item_type === "header" || item.item_type === "labor"
                          ? "-"
                          : item.unit_price != null
                            ? formatCurrency(item.unit_price)
                            : "-"}
                      </TableCell>
                      <TableCell align="right">
                        {item.item_type === "header"
                          ? "-"
                          : item.amount != null
                            ? formatCurrency(item.amount)
                            : "-"}
                      </TableCell>
                    </TableRow>
                  ))}
                <TableEmptyState message="" colSpan={0} />
              </TableBody>
            </Table>

            {/* Totals */}
            <div className="mt-4 border-t pt-4">
              <div className="flex justify-end">
                <div className="w-64 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">小計</span>
                    <span className="font-medium">{formatCurrency(invoice.subtotal)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">
                      消費税({Math.round(invoice.tax_rate * 100)}%)
                    </span>
                    <span className="font-medium">{formatCurrency(invoice.tax_amount)}</span>
                  </div>
                  <div className="flex justify-between border-t pt-2">
                    <span className="font-bold">合計</span>
                    <span className="font-bold text-blue-600">
                      {formatCurrency(invoice.total_amount)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </Card>

      {/* Daily Reports */}
      {daily_reports.length > 0 && (
        <Card className="mb-6">
          <h2 className="text-lg font-medium mb-4">紐づく日報</h2>
          <Table>
            <TableHeader>
              <TableHead>日付</TableHead>
              <TableHead>現場名</TableHead>
              <TableHead>作業内容概要</TableHead>
              <TableHead align="right">工賃</TableHead>
            </TableHeader>
            <TableBody>
              {daily_reports.map((report) => (
                <TableRow key={report.id}>
                  <TableCell>{formatDate(report.work_date)}</TableCell>
                  <TableCell>{report.site_name || "-"}</TableCell>
                  <TableCell>{report.summary || "-"}</TableCell>
                  <TableCell align="right">{formatCurrency(report.labor_cost)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}

      {/* Company Info */}
      {tenant && (
        <Card className="mb-6">
          <h2 className="text-lg font-medium mb-4">発行元情報</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <dt className="text-sm text-gray-600">会社名</dt>
              <dd className="font-medium">{tenant.name}</dd>
            </div>
            {tenant.representative_name && (
              <div>
                <dt className="text-sm text-gray-600">代表者</dt>
                <dd className="font-medium">{tenant.representative_name}</dd>
              </div>
            )}
            {(tenant.postal_code || tenant.address) && (
              <div className="md:col-span-2">
                <dt className="text-sm text-gray-600">住所</dt>
                <dd className="font-medium">
                  {tenant.postal_code && `〒${tenant.postal_code} `}
                  {tenant.address}
                </dd>
              </div>
            )}
            {tenant.phone_number && (
              <div>
                <dt className="text-sm text-gray-600">電話番号</dt>
                <dd className="font-medium">{tenant.phone_number}</dd>
              </div>
            )}
            {tenant.fax_number && (
              <div>
                <dt className="text-sm text-gray-600">FAX番号</dt>
                <dd className="font-medium">{tenant.fax_number}</dd>
              </div>
            )}
            {tenant.corporate_number && (
              <div className="md:col-span-2">
                <dt className="text-sm text-gray-600">登録番号</dt>
                <dd className="font-medium">{tenant.corporate_number}</dd>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Bank Account */}
      {bank_account && (
        <Card className="mb-6">
          <h2 className="text-lg font-medium mb-4">振込先</h2>
          <div className="text-gray-900">
            <p className="font-medium">
              {bank_account.bank_name} {bank_account.branch_name}{" "}
              {bank_account.account_type_label || bank_account.account_type}{" "}
              {bank_account.account_number_masked}
            </p>
            <p className="text-sm text-gray-600 mt-1">口座名義: {bank_account.account_holder}</p>
          </div>
        </Card>
      )}

      {/* Action Buttons */}
      <div className="flex justify-end gap-4 mb-6">
        <Button variant="secondary" onClick={() => navigate("/admin/invoices")}>
          一覧に戻る
        </Button>
      </div>

      {/* Cancel Confirmation Modal */}
      <ConfirmModal
        isOpen={showCancelModal}
        onClose={() => setShowCancelModal(false)}
        onConfirm={handleCancel}
        title="請求書の取消"
        message={`この請求書を取消しますか？\n\n取消後は編集できません。\n必要な場合は「コピー」で新規作成してください。`}
        confirmText="取消する"
        variant="danger"
        loading={cancelMutation.isPending}
      />
    </div>
  );
}
