import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { httpClient } from "../../api/mutator";
import type { TenantSettings } from "../../api/generated/timesheetAPI.schemas";
import { useToast } from "../../hooks/useToast";
import { Toast } from "../../components/Toast";

interface TenantResponse {
  tenant: TenantSettings;
}

interface FormData {
  name: string;
  default_unit_rate: string;
  time_increment_minutes: number;
  money_rounding: string;
}

interface FormErrors {
  name?: string;
  default_unit_rate?: string;
}

interface ChangeInfo {
  field: string;
  from: string;
  to: string;
}

const TIME_INCREMENT_OPTIONS = [
  { value: 1, label: "1分" },
  { value: 5, label: "5分" },
  { value: 10, label: "10分" },
  { value: 15, label: "15分" },
  { value: 20, label: "20分" },
  { value: 30, label: "30分" },
  { value: 60, label: "60分" },
];

const MONEY_ROUNDING_OPTIONS = [
  { value: "round", label: "四捨五入" },
  { value: "ceil", label: "切り上げ" },
  { value: "floor", label: "切り捨て" },
];

export function AdminTenantSettingsEditPage() {
  const navigate = useNavigate();
  const { toasts, showToast, removeToast } = useToast();
  const [originalTenant, setOriginalTenant] = useState<TenantSettings | null>(null);
  const [formData, setFormData] = useState<FormData>({
    name: "",
    default_unit_rate: "",
    time_increment_minutes: 15,
    money_rounding: "round",
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState(true);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [changes, setChanges] = useState<ChangeInfo[]>([]);

  useEffect(() => {
    const fetchTenant = async () => {
      setLoading(true);
      try {
        const response = await httpClient<TenantResponse>({
          url: "/admin/tenant",
        });
        setOriginalTenant(response.tenant);
        setFormData({
          name: response.tenant.name,
          default_unit_rate: String(response.tenant.default_unit_rate),
          time_increment_minutes: response.tenant.time_increment_minutes,
          money_rounding: response.tenant.money_rounding,
        });
      } catch (err) {
        showToast("自社設定の取得に失敗しました", "error");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchTenant();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const validateField = (field: keyof FormErrors, value: string): string | undefined => {
    if (field === "name") {
      if (!value.trim()) {
        return "自社名を入力してください";
      }
    } else if (field === "default_unit_rate") {
      if (!value.trim()) {
        return "基本時間単価を入力してください";
      }
      const numValue = Number(value);
      if (isNaN(numValue) || numValue < 0) {
        return "基本時間単価は0以上で入力してください";
      }
      if (!Number.isInteger(numValue)) {
        return "基本時間単価は整数で入力してください";
      }
    }
    return undefined;
  };

  const handleBlur = (field: keyof FormErrors) => {
    const value = formData[field];
    const error = validateField(field, value);
    setErrors((prev) => ({ ...prev, [field]: error }));
  };

  const hasChanges = (): boolean => {
    if (!originalTenant) return false;
    return (
      formData.name !== originalTenant.name ||
      Number(formData.default_unit_rate) !== originalTenant.default_unit_rate ||
      formData.time_increment_minutes !== originalTenant.time_increment_minutes ||
      formData.money_rounding !== originalTenant.money_rounding
    );
  };

  const hasErrors = (): boolean => {
    return Object.values(errors).some((error) => error !== undefined);
  };

  const getChanges = (): ChangeInfo[] => {
    if (!originalTenant) return [];
    const changeList: ChangeInfo[] = [];

    if (formData.name !== originalTenant.name) {
      changeList.push({
        field: "自社名",
        from: originalTenant.name,
        to: formData.name,
      });
    }

    if (Number(formData.default_unit_rate) !== originalTenant.default_unit_rate) {
      changeList.push({
        field: "基本時間単価",
        from: `${new Intl.NumberFormat("ja-JP").format(originalTenant.default_unit_rate)}円`,
        to: `${new Intl.NumberFormat("ja-JP").format(Number(formData.default_unit_rate))}円`,
      });
    }

    if (formData.time_increment_minutes !== originalTenant.time_increment_minutes) {
      const fromLabel = TIME_INCREMENT_OPTIONS.find(
        (o) => o.value === originalTenant.time_increment_minutes
      )?.label;
      const toLabel = TIME_INCREMENT_OPTIONS.find(
        (o) => o.value === formData.time_increment_minutes
      )?.label;
      changeList.push({
        field: "時間刻み",
        from: fromLabel || `${originalTenant.time_increment_minutes}分`,
        to: toLabel || `${formData.time_increment_minutes}分`,
      });
    }

    if (formData.money_rounding !== originalTenant.money_rounding) {
      const fromLabel = MONEY_ROUNDING_OPTIONS.find(
        (o) => o.value === originalTenant.money_rounding
      )?.label;
      const toLabel = MONEY_ROUNDING_OPTIONS.find(
        (o) => o.value === formData.money_rounding
      )?.label;
      changeList.push({
        field: "金額丸め方式",
        from: fromLabel || originalTenant.money_rounding,
        to: toLabel || formData.money_rounding,
      });
    }

    return changeList;
  };

  const handleSubmitClick = () => {
    const newErrors: FormErrors = {};
    newErrors.name = validateField("name", formData.name);
    newErrors.default_unit_rate = validateField("default_unit_rate", formData.default_unit_rate);

    setErrors(newErrors);

    if (Object.values(newErrors).some((error) => error !== undefined)) {
      return;
    }

    const changeList = getChanges();
    setChanges(changeList);
    setShowConfirmModal(true);
  };

  const handleConfirmUpdate = async () => {
    try {
      await httpClient<TenantResponse>({
        url: "/admin/tenant",
        method: "PATCH",
        data: {
          tenant: {
            name: formData.name,
            default_unit_rate: Number(formData.default_unit_rate),
            time_increment_minutes: formData.time_increment_minutes,
            money_rounding: formData.money_rounding,
          },
        },
      });
      showToast("設定を更新しました", "success");
      setShowConfirmModal(false);
      setTimeout(() => {
        navigate("/admin/settings");
      }, 1000);
    } catch (err: unknown) {
      if (err && typeof err === "object" && "response" in err) {
        const response = (err as { response?: { data?: { errors?: Record<string, string[]> } } })
          .response;
        if (response?.data?.errors) {
          const serverErrors = response.data.errors;
          const newErrors: FormErrors = {};
          if (serverErrors.name) {
            newErrors.name = serverErrors.name[0];
          }
          if (serverErrors.default_unit_rate) {
            newErrors.default_unit_rate = serverErrors.default_unit_rate[0];
          }
          setErrors(newErrors);
        }
      }
      showToast("設定の更新に失敗しました", "error");
      setShowConfirmModal(false);
      console.error(err);
    }
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

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h1 className="text-2xl font-bold text-gray-900">自社設定の編集</h1>
          </div>

          <div className="p-6 space-y-6">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">基本情報</h2>
              <div className="space-y-4">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                    自社名 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    onBlur={() => handleBlur("name")}
                    className={`w-full px-3 py-2 border rounded-md ${
                      errors.name ? "border-red-500" : "border-gray-300"
                    }`}
                  />
                  {errors.name && <p className="mt-1 text-sm text-red-500">{errors.name}</p>}
                </div>
              </div>
            </div>

            <div className="border-t border-gray-200 pt-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">業務設定</h2>
              <div className="space-y-4">
                <div>
                  <label
                    htmlFor="default_unit_rate"
                    className="flex items-center text-sm font-medium text-gray-700 mb-1"
                  >
                    基本時間単価 <span className="text-red-500 ml-1">*</span>
                    <span
                      className="ml-2 text-gray-400 cursor-help"
                      title="日報入力時の単価初期値として使用されます。作業者ごとに異なる単価を設定することも可能です。"
                    >
                      ℹ️
                    </span>
                  </label>
                  <div className="flex items-center">
                    <input
                      type="number"
                      id="default_unit_rate"
                      value={formData.default_unit_rate}
                      onChange={(e) =>
                        setFormData({ ...formData, default_unit_rate: e.target.value })
                      }
                      onBlur={() => handleBlur("default_unit_rate")}
                      className={`w-full px-3 py-2 border rounded-md ${
                        errors.default_unit_rate ? "border-red-500" : "border-gray-300"
                      }`}
                    />
                    <span className="ml-2 text-sm text-gray-700">円</span>
                  </div>
                  {errors.default_unit_rate && (
                    <p className="mt-1 text-sm text-red-500">{errors.default_unit_rate}</p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="time_increment_minutes"
                    className="flex items-center text-sm font-medium text-gray-700 mb-1"
                  >
                    時間刻み <span className="text-red-500 ml-1">*</span>
                    <span
                      className="ml-2 text-gray-400 cursor-help"
                      title="日報入力時の時間選択の刻み幅です。例: 15分刻みの場合、0:00、0:15、0:30、0:45...と選択できます。1分刻みから60分刻みまで選択可能です。"
                    >
                      ℹ️
                    </span>
                  </label>
                  <select
                    id="time_increment_minutes"
                    value={formData.time_increment_minutes}
                    onChange={(e) =>
                      setFormData({ ...formData, time_increment_minutes: Number(e.target.value) })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  >
                    {TIME_INCREMENT_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="money_rounding"
                    className="flex items-center text-sm font-medium text-gray-700 mb-1"
                  >
                    金額丸め方式 <span className="text-red-500 ml-1">*</span>
                    <span
                      className="ml-2 text-gray-400 cursor-help"
                      title="請求金額計算時の端数処理方法です。&#10;・四捨五入: 0.5未満切り捨て、0.5以上切り上げ&#10;・切り上げ: 常に切り上げ&#10;・切り捨て: 常に切り捨て"
                    >
                      ℹ️
                    </span>
                  </label>
                  <select
                    id="money_rounding"
                    value={formData.money_rounding}
                    onChange={(e) => setFormData({ ...formData, money_rounding: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  >
                    {MONEY_ROUNDING_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className="pt-6 flex justify-end gap-3">
              <button
                onClick={() => navigate("/admin/settings")}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                キャンセル
              </button>
              <button
                onClick={handleSubmitClick}
                disabled={!hasChanges() || hasErrors()}
                className={`px-4 py-2 rounded-md text-white ${
                  !hasChanges() || hasErrors()
                    ? "bg-gray-400 cursor-not-allowed"
                    : "bg-blue-600 hover:bg-blue-700"
                }`}
              >
                更新
              </button>
            </div>
          </div>
        </div>
      </div>

      {showConfirmModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-900">設定の更新確認</h3>
              <button
                onClick={() => setShowConfirmModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✗
              </button>
            </div>

            <div className="p-6">
              <p className="text-sm text-gray-700 mb-4">以下の内容で更新します。よろしいですか？</p>

              {changes.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-semibold text-gray-900">変更内容</h4>
                  {changes.map((change, index) => (
                    <div key={index} className="text-sm text-gray-700">
                      <span className="font-medium">{change.field}:</span> {change.from} →{" "}
                      {change.to}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
              <button
                onClick={() => setShowConfirmModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                戻る
              </button>
              <button
                onClick={handleConfirmUpdate}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                更新する
              </button>
            </div>
          </div>
        </div>
      )}

      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          message={toast.message}
          type={toast.type}
          onClose={() => removeToast(toast.id)}
        />
      ))}
    </div>
  );
}
