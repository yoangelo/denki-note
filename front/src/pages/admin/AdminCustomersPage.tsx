import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import { httpClient } from "../../api/mutator";
import type { Customer } from "../../api/generated/timesheetAPI.schemas";
import {
  Button,
  Input,
  Select,
  Badge,
  Alert,
  PageHeader,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  TableEmptyState,
  ConfirmModal,
} from "../../components/ui";

interface CustomersResponse {
  customers: Customer[];
}

export function AdminCustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deleteModal, setDeleteModal] = useState<{ open: boolean; customer: Customer | null }>({
    open: false,
    customer: null,
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"created_at" | "name" | "rate_percent">("created_at");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [showDiscarded, setShowDiscarded] = useState(false);

  const fetchCustomers = useCallback(
    async (search?: string) => {
      setLoading(true);
      setError("");
      try {
        const params = new URLSearchParams();
        if (search) params.append("search", search);
        params.append("sort_by", sortBy);
        params.append("sort_order", sortOrder);
        if (showDiscarded) params.append("show_discarded", "true");

        const response = await httpClient<CustomersResponse>({
          url: `/admin/customers?${params.toString()}`,
        });
        setCustomers(response.customers);
      } catch (err) {
        setError("顧客一覧の取得に失敗しました");
        console.error(err);
      } finally {
        setLoading(false);
      }
    },
    [sortBy, sortOrder, showDiscarded]
  );

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  const handleSearch = () => {
    fetchCustomers(searchQuery);
  };

  const handleSortChange = (value: string) => {
    const [field, order] = value.split("_");
    if (field === "created" && order === "at") {
      setSortBy("created_at");
      setSortOrder("desc");
    } else if (field === "created" && order === "asc") {
      setSortBy("created_at");
      setSortOrder("asc");
    } else if (field === "name" && order === "asc") {
      setSortBy("name");
      setSortOrder("asc");
    } else if (field === "name" && order === "desc") {
      setSortBy("name");
      setSortOrder("desc");
    }
  };

  const handleDelete = async () => {
    if (!deleteModal.customer) return;

    try {
      await httpClient({
        url: `/admin/customers/${deleteModal.customer.id}`,
        method: "DELETE",
      });
      setDeleteModal({ open: false, customer: null });
      toast.success("顧客を削除しました");
      fetchCustomers();
    } catch (err) {
      setError("顧客の削除に失敗しました");
      toast.error("顧客の削除に失敗しました");
      console.error(err);
    }
  };

  const getCustomerTypeLabel = (type: string) => {
    return type === "corporate" ? "法人" : "個人";
  };

  return (
    <div>
      <PageHeader
        title="顧客一覧"
        action={
          <Link to="/admin/customers/new" className="no-underline">
            <Button>+ 新規作成</Button>
          </Link>
        }
      />

      <div className="mb-4 flex gap-3">
        <Input
          type="text"
          placeholder="顧客名で検索..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleSearch();
          }}
          className="w-80"
        />
        <Button onClick={handleSearch} variant="secondary">
          検索
        </Button>
      </div>

      <div className="mb-6 flex items-center justify-between">
        <label className="flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={showDiscarded}
            onChange={(e) => setShowDiscarded(e.target.checked)}
            className="mr-2 w-4 h-4 cursor-pointer"
          />
          <span className="text-sm text-gray-700">削除済みを表示</span>
        </label>
        <Select
          value={`${sortBy}_${sortOrder === "desc" ? (sortBy === "created_at" ? "at" : "desc") : "asc"}`}
          onChange={(e) => handleSortChange(e.target.value)}
          className="w-64"
        >
          <option value="created_at">作成日時（新しい順）</option>
          <option value="created_asc">作成日時（古い順）</option>
          <option value="name_asc">顧客名（あいうえお順）</option>
          <option value="name_desc">顧客名（逆順）</option>
        </Select>
      </div>

      {error && (
        <Alert variant="error" className="mb-6">
          {error}
        </Alert>
      )}

      {loading ? (
        <div className="text-center py-12 text-gray-500">読み込み中...</div>
      ) : (
        <>
          <div className="hidden md:block">
            <Table>
              <TableHeader>
                <TableHead>顧客名</TableHead>
                <TableHead>企業区分</TableHead>
                <TableHead>法人番号</TableHead>
                <TableHead>掛率</TableHead>
                <TableHead align="center">削除</TableHead>
              </TableHeader>
              <TableBody>
                {customers.length === 0 ? (
                  <TableEmptyState message="顧客が登録されていません" colSpan={5} />
                ) : (
                  customers.map((customer) => {
                    const isDiscarded = !!customer.discarded_at;
                    return (
                      <TableRow key={customer.id} className={isDiscarded ? "bg-gray-100" : ""}>
                        <TableCell>
                          {isDiscarded ? (
                            <span className="text-gray-600 flex items-center gap-2">
                              <div className="i-heroicons-trash w-4 h-4" />
                              {customer.name}
                            </span>
                          ) : (
                            <Link
                              to={`/admin/customers/${customer.id}`}
                              className="text-blue-600 hover:text-blue-800 no-underline font-medium"
                            >
                              {customer.name}
                            </Link>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant="gray" size="sm">
                            {getCustomerTypeLabel(customer.customer_type)}
                          </Badge>
                        </TableCell>
                        <TableCell>{customer.corporation_number || "-"}</TableCell>
                        <TableCell>{customer.rate_percent}%</TableCell>
                        <TableCell align="center">
                          {isDiscarded ? (
                            <Badge variant="gray" size="sm">
                              削除済
                            </Badge>
                          ) : (
                            <button
                              onClick={() => setDeleteModal({ open: true, customer })}
                              className="text-red-600 hover:text-red-800 transition-colors p-1 rounded hover:bg-red-50"
                              title="削除"
                              aria-label={`${customer.name}を削除`}
                            >
                              <div className="i-heroicons-trash w-5 h-5" />
                            </button>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>

          <div className="md:hidden space-y-4">
            {customers.length === 0 ? (
              <div className="text-center py-8 text-gray-500">顧客が登録されていません</div>
            ) : (
              customers.map((customer) => {
                const isDiscarded = !!customer.discarded_at;
                return (
                  <div
                    key={customer.id}
                    className={`shadow rounded-lg p-4 border ${
                      isDiscarded ? "bg-gray-200 border-gray-300" : "bg-white border-gray-200"
                    }`}
                  >
                    <div className="flex justify-between items-start mb-3">
                      {isDiscarded ? (
                        <span className="text-lg font-semibold text-gray-600 flex items-center gap-2">
                          <div className="i-heroicons-trash w-5 h-5" />
                          {customer.name}
                        </span>
                      ) : (
                        <Link
                          to={`/admin/customers/${customer.id}`}
                          className="text-lg font-semibold text-blue-600 hover:underline"
                        >
                          {customer.name}
                        </Link>
                      )}
                      {isDiscarded ? (
                        <Badge variant="gray" size="sm">
                          削除済
                        </Badge>
                      ) : (
                        <button
                          onClick={() => setDeleteModal({ open: true, customer })}
                          className="text-red-600 hover:text-red-800 transition-colors ml-2 p-1"
                          aria-label={`${customer.name}を削除`}
                        >
                          <div className="i-heroicons-trash w-5 h-5" />
                        </button>
                      )}
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex">
                        <span className="font-semibold w-24">企業区分:</span>
                        <span>{getCustomerTypeLabel(customer.customer_type)}</span>
                      </div>
                      <div className="flex">
                        <span className="font-semibold w-24">法人番号:</span>
                        <span>{customer.corporation_number || "-"}</span>
                      </div>
                      <div className="flex">
                        <span className="font-semibold w-24">掛率:</span>
                        <span>{customer.rate_percent}%</span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </>
      )}

      <ConfirmModal
        isOpen={deleteModal.open && !!deleteModal.customer}
        onClose={() => setDeleteModal({ open: false, customer: null })}
        onConfirm={handleDelete}
        title="顧客の削除"
        message={`「${deleteModal.customer?.name}」を削除しますか？\n\n※紐づく現場も削除されます。\n※削除後も日報データは保持されます。`}
        confirmText="削除する"
        variant="danger"
      />
    </div>
  );
}
