import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { httpClient } from "../../api/mutator";
import type { Customer, Site } from "../../api/generated/timesheetAPI.schemas";

interface CustomerDetailResponse {
  customer: Customer;
  sites: Site[];
}

export function AdminCustomerDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [sites, setSites] = useState<Site[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchCustomerDetail = useCallback(async () => {
    if (!id) return;

    setLoading(true);
    setError("");
    try {
      const response = await httpClient<CustomerDetailResponse>({
        url: `/admin/customers/${id}`,
      });
      setCustomer(response.customer);
      setSites(response.sites);
    } catch (err) {
      setError("顧客情報の取得に失敗しました");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchCustomerDetail();
  }, [fetchCustomerDetail]);

  const getCustomerTypeLabel = (type: string) => {
    return type === "corporate" ? "法人" : "個人";
  };

  if (loading) {
    return <div className="text-center py-8">読み込み中...</div>;
  }

  if (error || !customer) {
    return (
      <div>
        <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded">
          {error || "顧客が見つかりません"}
        </div>
        <button
          onClick={() => navigate("/admin/customers")}
          className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-100 transition-colors"
        >
          一覧に戻る
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">顧客詳細</h2>
        <Link
          to={`/admin/customers/${id}/edit`}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors no-underline"
        >
          編集
        </Link>
      </div>

      <div className="max-w-2xl">
        <div className="mb-8">
          <h3 className="text-lg font-bold mb-4">顧客情報</h3>
          <div className="bg-gray-50 p-4 rounded">
            <div className="mb-3">
              <span className="font-semibold">顧客名:</span> {customer.name}
            </div>
            <div className="mb-3">
              <span className="font-semibold">企業区分:</span>{" "}
              {getCustomerTypeLabel(customer.customer_type)}
            </div>
            <div className="mb-3">
              <span className="font-semibold">法人番号:</span> {customer.corporation_number || "-"}
            </div>
            <div className="mb-3">
              <span className="font-semibold">掛率:</span> {customer.rate_percent}%
            </div>
            <div>
              <span className="font-semibold">概要:</span> {customer.note || "-"}
            </div>
          </div>
        </div>

        <div className="mb-8">
          <h3 className="text-lg font-bold mb-4">現場一覧</h3>
          {sites.length === 0 ? (
            <div className="text-center py-8 text-gray-500">現場が登録されていません</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse bg-white shadow rounded">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border border-gray-300 px-4 py-2 text-left">現場名</th>
                    <th className="border border-gray-300 px-4 py-2 text-left">概要</th>
                  </tr>
                </thead>
                <tbody>
                  {sites.map((site) => (
                    <tr key={site.id} className="hover:bg-gray-50">
                      <td className="border border-gray-300 px-4 py-2">{site.name}</td>
                      <td className="border border-gray-300 px-4 py-2">{site.note || "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div>
          <button
            onClick={() => navigate("/admin/customers")}
            className="px-6 py-2 border border-gray-300 rounded hover:bg-gray-100 transition-colors"
          >
            一覧に戻る
          </button>
        </div>
      </div>
    </div>
  );
}
