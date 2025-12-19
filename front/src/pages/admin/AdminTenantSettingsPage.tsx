import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { httpClient } from "../../api/mutator";
import type { TenantSettings } from "../../api/generated/timesheetAPI.schemas";

interface TenantResponse {
  tenant: TenantSettings;
}

export function AdminTenantSettingsPage() {
  const navigate = useNavigate();
  const [tenant, setTenant] = useState<TenantSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchTenant = async () => {
      setLoading(true);
      setError("");
      try {
        const response = await httpClient<TenantResponse>({
          url: "/admin/tenant",
        });
        setTenant(response.tenant);
      } catch (err) {
        setError("自社設定の取得に失敗しました");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchTenant();
  }, []);

  const getMoneyRoundingLabel = (rounding: string) => {
    switch (rounding) {
      case "round":
        return "四捨五入";
      case "ceil":
        return "切り上げ";
      case "floor":
        return "切り捨て";
      default:
        return rounding;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("ja-JP").format(amount);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center text-gray-600">読み込み中...</div>
        </div>
      </div>
    );
  }

  if (error || !tenant) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center text-red-600">{error || "データの取得に失敗しました"}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-900">自社設定</h1>
            <button
              onClick={() => navigate("/admin/settings/edit")}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors"
            >
              編集
            </button>
          </div>

          <div className="p-6 space-y-6">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">基本情報</h2>
              <div className="space-y-3">
                <div className="flex">
                  <dt className="w-40 text-sm font-medium text-gray-500">自社名:</dt>
                  <dd className="text-sm text-gray-900">{tenant.name}</dd>
                </div>
                <div className="flex">
                  <dt className="w-40 text-sm font-medium text-gray-500">郵便番号:</dt>
                  <dd className="text-sm text-gray-900">{tenant.postal_code || "-"}</dd>
                </div>
                <div className="flex">
                  <dt className="w-40 text-sm font-medium text-gray-500">住所:</dt>
                  <dd className="text-sm text-gray-900">{tenant.address || "-"}</dd>
                </div>
                <div className="flex">
                  <dt className="w-40 text-sm font-medium text-gray-500">電話番号:</dt>
                  <dd className="text-sm text-gray-900">{tenant.phone_number || "-"}</dd>
                </div>
                <div className="flex">
                  <dt className="w-40 text-sm font-medium text-gray-500">FAX番号:</dt>
                  <dd className="text-sm text-gray-900">{tenant.fax_number || "-"}</dd>
                </div>
                <div className="flex">
                  <dt className="w-40 text-sm font-medium text-gray-500">登録番号:</dt>
                  <dd className="text-sm text-gray-900">{tenant.corporate_number || "-"}</dd>
                </div>
                <div className="flex">
                  <dt className="w-40 text-sm font-medium text-gray-500">代表者名:</dt>
                  <dd className="text-sm text-gray-900">{tenant.representative_name || "-"}</dd>
                </div>
              </div>
            </div>

            <div className="border-t border-gray-200 pt-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">業務設定</h2>
              <div className="space-y-3">
                <div className="flex">
                  <dt className="w-40 text-sm font-medium text-gray-500">基本時間単価:</dt>
                  <dd className="text-sm text-gray-900">
                    {formatCurrency(tenant.default_unit_rate)}円/時間
                  </dd>
                </div>
                <div className="flex">
                  <dt className="w-40 text-sm font-medium text-gray-500">金額丸め方式:</dt>
                  <dd className="text-sm text-gray-900">
                    {getMoneyRoundingLabel(tenant.money_rounding)}
                  </dd>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
