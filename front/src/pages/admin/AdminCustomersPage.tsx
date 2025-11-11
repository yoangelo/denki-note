import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { httpClient } from "../../api/mutator";
import type { Customer } from "../../api/generated/timesheetAPI.schemas";
import { useToast } from "../../hooks/useToast";
import { Toast } from "../../components/Toast";

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
  const { toasts, showToast, removeToast } = useToast();

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
      showToast("顧客を削除しました", "success");
      fetchCustomers();
    } catch (err) {
      setError("顧客の削除に失敗しました");
      showToast("顧客の削除に失敗しました", "error");
      console.error(err);
    }
  };

  const getCustomerTypeLabel = (type: string) => {
    return type === "corporate" ? "法人" : "個人";
  };

  return (
    <div>
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          message={toast.message}
          type={toast.type}
          onClose={() => removeToast(toast.id)}
        />
      ))}

      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">顧客一覧</h2>
        <Link
          to="/admin/customers/new"
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors no-underline"
        >
          + 新規作成
        </Link>
      </div>

      {/* 検索・ソートエリア */}
      <div className="mb-4 space-y-4 md:space-y-0 md:flex md:gap-4 md:items-center">
        <div className="flex-1 flex gap-2">
          <input
            type="text"
            placeholder="顧客名で検索..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSearch();
            }}
            className="flex-1 px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={handleSearch}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors"
          >
            検索
          </button>
        </div>
        <div className="md:w-64">
          <select
            value={`${sortBy}_${sortOrder === "desc" ? (sortBy === "created_at" ? "at" : "desc") : "asc"}`}
            onChange={(e) => handleSortChange(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="created_at">作成日時（新しい順）</option>
            <option value="created_asc">作成日時（古い順）</option>
            <option value="name_asc">顧客名（あいうえお順）</option>
            <option value="name_desc">顧客名（逆順）</option>
          </select>
        </div>
      </div>

      {/* 削除済み表示切り替え */}
      <div className="mb-4">
        <label className="flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={showDiscarded}
            onChange={(e) => setShowDiscarded(e.target.checked)}
            className="mr-2 w-4 h-4 cursor-pointer"
          />
          <span className="text-sm">削除済みを表示</span>
        </label>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded">{error}</div>
      )}

      {loading ? (
        <div className="text-center py-8">読み込み中...</div>
      ) : (
        <>
          {/* PC・タブレット表示（768px以上） */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full border-collapse bg-white shadow rounded">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border border-gray-300 px-4 py-2 text-left">顧客名</th>
                  <th className="border border-gray-300 px-4 py-2 text-left">企業区分</th>
                  <th className="border border-gray-300 px-4 py-2 text-left">法人番号</th>
                  <th className="border border-gray-300 px-4 py-2 text-left">掛率</th>
                  <th className="border border-gray-300 px-4 py-2 text-center">削除</th>
                </tr>
              </thead>
              <tbody>
                {customers.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="border border-gray-300 px-4 py-8 text-center text-gray-500"
                    >
                      顧客が登録されていません
                    </td>
                  </tr>
                ) : (
                  customers.map((customer) => {
                    const isDiscarded = !!customer.discarded_at;
                    return (
                      <tr
                        key={customer.id}
                        className={isDiscarded ? "bg-gray-200" : "hover:bg-gray-50"}
                      >
                        <td className="border border-gray-300 px-4 py-2">
                          {isDiscarded ? (
                            <span className="text-gray-600 flex items-center gap-1">
                              <div className="i-heroicons-trash w-4 h-4" />
                              {customer.name}
                            </span>
                          ) : (
                            <Link
                              to={`/admin/customers/${customer.id}`}
                              className="text-blue-600 hover:underline"
                            >
                              {customer.name}
                            </Link>
                          )}
                        </td>
                        <td className="border border-gray-300 px-4 py-2">
                          {getCustomerTypeLabel(customer.customer_type)}
                        </td>
                        <td className="border border-gray-300 px-4 py-2">
                          {customer.corporation_number || "-"}
                        </td>
                        <td className="border border-gray-300 px-4 py-2">
                          {customer.rate_percent}%
                        </td>
                        <td className="border border-gray-300 px-4 py-2 text-center">
                          {isDiscarded ? (
                            <span className="text-gray-600 text-sm">削除済</span>
                          ) : (
                            <button
                              onClick={() => setDeleteModal({ open: true, customer })}
                              className="text-red-600 hover:text-red-800 transition-colors"
                              title="削除"
                              aria-label={`${customer.name}を削除`}
                            >
                              <div className="i-heroicons-trash w-5 h-5" />
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* スマホ表示（767px以下） */}
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
                        <span className="text-lg font-semibold text-gray-600 flex items-center gap-1">
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
                        <span className="text-gray-600 text-sm ml-2">削除済</span>
                      ) : (
                        <button
                          onClick={() => setDeleteModal({ open: true, customer })}
                          className="text-red-600 hover:text-red-800 transition-colors ml-2"
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

      {/* 削除確認モーダル */}
      {deleteModal.open && deleteModal.customer && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold">顧客の削除</h3>
              <button
                onClick={() => setDeleteModal({ open: false, customer: null })}
                className="text-gray-500 hover:text-gray-700"
              >
                <div className="i-heroicons-x-mark w-6 h-6" />
              </button>
            </div>
            <p className="mb-4">「{deleteModal.customer.name}」を削除しますか？</p>
            <p className="mb-4 text-sm text-gray-600">
              ※紐づく現場も削除されます。
              <br />
              ※削除後も日報データは保持されます。
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setDeleteModal({ open: false, customer: null })}
                className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-100 transition-colors"
              >
                キャンセル
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded transition-colors"
              >
                削除する
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
