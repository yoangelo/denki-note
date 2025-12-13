import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAdminListInvoices } from "../../api/generated/admin/admin";
import { useListCustomers } from "../../api/generated/customers/customers";
import { useListSites } from "../../api/generated/sites/sites";
import type {
  AdminListInvoicesSortBy,
  AdminListInvoicesSortOrder,
  AdminListInvoicesStatus,
} from "../../api/generated/timesheetAPI.schemas";
import { InvoiceStatusBadge } from "../../components/InvoiceStatusBadge";
import {
  Button,
  Select,
  Input,
  PageHeader,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  TableEmptyState,
} from "../../components/ui";
import { formatCurrency, formatDate } from "../../utils";

type SortConfig = {
  key: AdminListInvoicesSortBy;
  order: AdminListInvoicesSortOrder;
};

const SORT_KEY_LABELS: Record<AdminListInvoicesSortBy, string> = {
  invoice_number: "請求書番号",
  title: "件名",
  customer_name: "顧客名",
  total_amount: "金額",
  billing_date: "請求日",
  issued_at: "発行日",
  created_at: "作成日",
};

export function AdminInvoicesPage() {
  const navigate = useNavigate();

  const [customerId, setCustomerId] = useState<string>("");
  const [siteId, setSiteId] = useState<string>("");
  const [status, setStatus] = useState<AdminListInvoicesStatus | "">("");
  const [issuedFrom, setIssuedFrom] = useState<string>("");
  const [issuedTo, setIssuedTo] = useState<string>("");
  const [page, setPage] = useState(1);
  const [sortConfig, setSortConfig] = useState<SortConfig>({
    key: "created_at",
    order: "desc",
  });

  const { data: customers = [] } = useListCustomers();

  const { data: sites = [] } = useListSites(
    customerId ? { customer_id: customerId } : { customer_id: "" }
  );

  const { data, isLoading } = useAdminListInvoices({
    customer_id: customerId || undefined,
    site_id: siteId || undefined,
    status: status || undefined,
    issued_from: issuedFrom || undefined,
    issued_to: issuedTo || undefined,
    sort_by: sortConfig.key,
    sort_order: sortConfig.order,
    page,
    per_page: 20,
  });

  const invoices = data?.invoices || [];
  const meta = data?.meta;

  const customerOptions = useMemo(() => {
    return [
      { value: "", label: "全て" },
      ...customers.map((c) => ({ value: c.id, label: c.name })),
    ];
  }, [customers]);

  const siteOptions = useMemo(() => {
    if (!customerId) return [{ value: "", label: "全て" }];
    return [{ value: "", label: "全て" }, ...sites.map((s) => ({ value: s.id, label: s.name }))];
  }, [customerId, sites]);

  const statusOptions = [
    { value: "", label: "全て" },
    { value: "draft", label: "下書き" },
    { value: "issued", label: "発行済み" },
    { value: "canceled", label: "取消済み" },
  ];

  const handleSort = (key: AdminListInvoicesSortBy) => {
    setSortConfig((prev) => ({
      key,
      order: prev.key === key && prev.order === "asc" ? "desc" : "asc",
    }));
    setPage(1);
  };

  const getSortIcon = (key: AdminListInvoicesSortBy) => {
    if (sortConfig.key !== key) return null;
    return sortConfig.order === "asc" ? "▲" : "▼";
  };

  const handleCustomerChange = (value: string) => {
    setCustomerId(value);
    setSiteId("");
    setPage(1);
  };

  const handleReset = () => {
    setCustomerId("");
    setSiteId("");
    setStatus("");
    setIssuedFrom("");
    setIssuedTo("");
    setPage(1);
  };

  const handleRowClick = (invoiceId: string) => {
    navigate(`/admin/invoices/${invoiceId}`);
  };

  const totalPages = meta?.total_pages || 1;

  const SortableHeader = ({
    sortKey,
    align = "left",
  }: {
    sortKey: AdminListInvoicesSortBy;
    align?: "left" | "center" | "right";
  }) => (
    <TableHead align={align}>
      <span
        className="flex items-center gap-1 cursor-pointer hover:text-blue-600"
        onClick={() => handleSort(sortKey)}
      >
        {SORT_KEY_LABELS[sortKey]}
        <span className="text-blue-600">{getSortIcon(sortKey)}</span>
      </span>
    </TableHead>
  );

  return (
    <div>
      <PageHeader
        title="請求書一覧"
        action={<Button onClick={() => navigate("/admin/invoices/new")}>+ 新規作成</Button>}
      />

      <div className="mb-6 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
          <Select
            label="顧客"
            value={customerId}
            onChange={(e) => handleCustomerChange(e.target.value)}
          >
            {customerOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </Select>
          <Select
            label="現場"
            value={siteId}
            onChange={(e) => {
              setSiteId(e.target.value);
              setPage(1);
            }}
            disabled={!customerId}
          >
            {siteOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </Select>
          <Select
            label="ステータス"
            value={status}
            onChange={(e) => {
              setStatus(e.target.value as AdminListInvoicesStatus | "");
              setPage(1);
            }}
          >
            {statusOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </Select>
          <Input
            label="発行日（開始）"
            type="date"
            value={issuedFrom}
            onChange={(e) => {
              setIssuedFrom(e.target.value);
              setPage(1);
            }}
          />
          <Input
            label="発行日（終了）"
            type="date"
            value={issuedTo}
            onChange={(e) => {
              setIssuedTo(e.target.value);
              setPage(1);
            }}
          />
        </div>
        <div className="flex justify-end">
          <Button variant="secondary" onClick={handleReset}>
            フィルターをクリア
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-8 text-gray-500">読み込み中...</div>
      ) : (
        <>
          <div className="hidden md:block">
            <Table>
              <TableHeader>
                <SortableHeader sortKey="invoice_number" />
                <SortableHeader sortKey="title" />
                <SortableHeader sortKey="customer_name" />
                <TableHead>現場名</TableHead>
                <SortableHeader sortKey="total_amount" align="right" />
                <TableHead align="center">ステータス</TableHead>
                <SortableHeader sortKey="issued_at" />
              </TableHeader>
              <TableBody>
                {invoices.length === 0 ? (
                  <TableEmptyState message="請求書がありません" colSpan={7} />
                ) : (
                  invoices.map((invoice) => (
                    <TableRow
                      key={invoice.id}
                      className={invoice.status === "canceled" ? "opacity-50" : ""}
                      onClick={() => handleRowClick(invoice.id)}
                    >
                      <TableCell>
                        <span className="text-blue-600 hover:text-blue-800 font-medium">
                          {invoice.status === "draft"
                            ? "（下書き）"
                            : invoice.invoice_number || "-"}
                        </span>
                      </TableCell>
                      <TableCell>{invoice.title || "-"}</TableCell>
                      <TableCell>{invoice.customer_name}</TableCell>
                      <TableCell>{invoice.site_name || "-"}</TableCell>
                      <TableCell align="right">{formatCurrency(invoice.total_amount)}</TableCell>
                      <TableCell align="center">
                        <InvoiceStatusBadge status={invoice.status} />
                      </TableCell>
                      <TableCell>{formatDate(invoice.issued_at)}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          <div className="md:hidden space-y-4">
            {invoices.length === 0 ? (
              <div className="text-center py-8 text-gray-500">請求書がありません</div>
            ) : (
              invoices.map((invoice) => (
                <div
                  key={invoice.id}
                  className={`shadow rounded-lg p-4 border bg-white border-gray-200 cursor-pointer hover:shadow-md transition-shadow ${
                    invoice.status === "canceled" ? "opacity-50" : ""
                  }`}
                  onClick={() => handleRowClick(invoice.id)}
                >
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <span className="text-lg font-semibold text-blue-600">
                        {invoice.status === "draft" ? "（下書き）" : invoice.invoice_number || "-"}
                      </span>
                      <p className="text-sm text-gray-600 mt-1">
                        {invoice.title || "タイトルなし"}
                      </p>
                    </div>
                    <InvoiceStatusBadge status={invoice.status} />
                  </div>
                  <div className="space-y-1 text-sm">
                    <div className="flex">
                      <span className="font-semibold w-16">顧客:</span>
                      <span>{invoice.customer_name}</span>
                    </div>
                    <div className="flex">
                      <span className="font-semibold w-16">現場:</span>
                      <span>{invoice.site_name || "-"}</span>
                    </div>
                    <div className="flex">
                      <span className="font-semibold w-16">金額:</span>
                      <span className="font-medium">{formatCurrency(invoice.total_amount)}</span>
                    </div>
                    <div className="flex">
                      <span className="font-semibold w-16">発行日:</span>
                      <span>{formatDate(invoice.issued_at)}</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {totalPages > 1 && (
            <div className="mt-6 flex justify-center items-center gap-4">
              <Button
                variant="secondary"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                前へ
              </Button>
              <span className="text-sm text-gray-600">
                {page} / {totalPages} ページ
              </span>
              <Button
                variant="secondary"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
              >
                次へ
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
