import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { httpClient } from "../../api/mutator";
import type { Customer } from "../../api/generated/timesheetAPI.schemas";

interface FormErrors {
  name?: string;
  customer_type?: string;
  corporation_number?: string;
  rate_percent?: string;
}

interface CustomerDetailResponse {
  customer: Customer;
}

export function AdminCustomerEditPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const [initialData, setInitialData] = useState({
    name: "",
    customer_type: "",
    corporation_number: "",
    rate_percent: "",
    note: "",
  });

  const [formData, setFormData] = useState({
    name: "",
    customer_type: "",
    corporation_number: "",
    rate_percent: "",
    note: "",
  });

  const [errors, setErrors] = useState<FormErrors>({});

  const fetchCustomer = useCallback(async () => {
    if (!id) return;

    setLoading(true);
    setError("");
    try {
      const response = await httpClient<CustomerDetailResponse>({
        url: `/admin/customers/${id}`,
      });
      const customer = response.customer;

      const data = {
        name: customer.name,
        customer_type: customer.customer_type,
        corporation_number: customer.corporation_number || "",
        rate_percent: String(customer.rate_percent),
        note: customer.note || "",
      };

      setInitialData(data);
      setFormData(data);
    } catch (err) {
      setError("顧客情報の取得に失敗しました");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchCustomer();
  }, [fetchCustomer]);

  const validateCustomerName = (value: string): string | undefined => {
    if (!value.trim()) {
      return "顧客名を入力してください";
    }
    return undefined;
  };

  const validateCustomerType = (value: string): string | undefined => {
    if (!value || value === "選択") {
      return "企業区分を選択してください";
    }
    return undefined;
  };

  const validateCorporationNumber = (value: string): string | undefined => {
    if (value && !/^\d+$/.test(value)) {
      return "法人番号は数字のみ入力してください";
    }
    return undefined;
  };

  const validateRatePercent = (value: string): string | undefined => {
    if (!value) {
      return "掛率を入力してください";
    }
    const num = parseInt(value);
    if (isNaN(num) || num < 0 || num > 300) {
      return "掛率は0〜300の範囲で入力してください";
    }
    return undefined;
  };

  const handleFieldBlur = (field: keyof typeof formData) => {
    let error: string | undefined;
    switch (field) {
      case "name":
        error = validateCustomerName(formData.name);
        break;
      case "customer_type":
        error = validateCustomerType(formData.customer_type);
        break;
      case "corporation_number":
        error = validateCorporationNumber(formData.corporation_number);
        break;
      case "rate_percent":
        error = validateRatePercent(formData.rate_percent);
        break;
    }
    setErrors((prev) => ({ ...prev, [field]: error }));
  };

  const isFormValid = () => {
    return (
      formData.name.trim() !== "" &&
      formData.customer_type !== "" &&
      formData.customer_type !== "選択" &&
      formData.rate_percent !== "" &&
      !errors.name &&
      !errors.customer_type &&
      !errors.corporation_number &&
      !errors.rate_percent
    );
  };

  const getChanges = () => {
    const changes: Array<{ field: string; oldValue: string; newValue: string }> = [];

    if (formData.name !== initialData.name) {
      changes.push({ field: "顧客名", oldValue: initialData.name, newValue: formData.name });
    }

    if (formData.customer_type !== initialData.customer_type) {
      const oldLabel = getCustomerTypeLabel(initialData.customer_type);
      const newLabel = getCustomerTypeLabel(formData.customer_type);
      changes.push({ field: "企業区分", oldValue: oldLabel, newValue: newLabel });
    }

    if (formData.corporation_number !== initialData.corporation_number) {
      changes.push({
        field: "法人番号",
        oldValue: initialData.corporation_number || "（なし）",
        newValue: formData.corporation_number || "（なし）",
      });
    }

    if (formData.rate_percent !== initialData.rate_percent) {
      changes.push({
        field: "掛率",
        oldValue: `${initialData.rate_percent}%`,
        newValue: `${formData.rate_percent}%`,
      });
    }

    if (formData.note !== initialData.note) {
      changes.push({
        field: "概要",
        oldValue: initialData.note || "（なし）",
        newValue: formData.note || "（なし）",
      });
    }

    return changes;
  };

  const handleSubmit = async () => {
    if (!id) return;

    setSubmitting(true);
    setError("");

    try {
      const payload: {
        customer: {
          name: string;
          customer_type: string;
          rate_percent: number;
          corporation_number?: string;
          note?: string;
        };
      } = {
        customer: {
          name: formData.name,
          customer_type: formData.customer_type,
          rate_percent: parseInt(formData.rate_percent),
        },
      };

      if (formData.corporation_number) {
        payload.customer.corporation_number = formData.corporation_number;
      }

      if (formData.note) {
        payload.customer.note = formData.note;
      }

      await httpClient({
        url: `/admin/customers/${id}`,
        method: "PATCH",
        data: payload,
      });

      navigate(`/admin/customers/${id}`);
    } catch (err: unknown) {
      setError("顧客の更新に失敗しました");
      console.error(err);
    } finally {
      setSubmitting(false);
      setShowConfirmModal(false);
    }
  };

  const getCustomerTypeLabel = (type: string) => {
    if (type === "corporate") return "法人";
    if (type === "individual") return "個人";
    return type;
  };

  if (loading) {
    return <div className="text-center py-8">読み込み中...</div>;
  }

  if (error && !formData.name) {
    return (
      <div>
        <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded">{error}</div>
        <button
          onClick={() => navigate("/admin/customers")}
          className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-100 transition-colors"
        >
          一覧に戻る
        </button>
      </div>
    );
  }

  const changes = getChanges();

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">顧客の編集</h2>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded">{error}</div>
      )}

      <div className="max-w-2xl">
        <div className="mb-8">
          <h3 className="text-lg font-bold mb-4">顧客情報</h3>

          <div className="mb-4">
            <label className="block mb-2">
              顧客名 <span className="text-red-600">*</span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              onBlur={() => handleFieldBlur("name")}
              className={`w-full px-4 py-2 border rounded ${
                errors.name ? "border-red-500" : "border-gray-300"
              }`}
              placeholder="例: ㈱ABC建設"
            />
            {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
          </div>

          <div className="mb-4">
            <label className="block mb-2">
              企業区分 <span className="text-red-600">*</span>
            </label>
            <select
              value={formData.customer_type}
              onChange={(e) => setFormData({ ...formData, customer_type: e.target.value })}
              onBlur={() => handleFieldBlur("customer_type")}
              className={`w-full px-4 py-2 border rounded ${
                errors.customer_type ? "border-red-500" : "border-gray-300"
              }`}
            >
              <option value="">選択</option>
              <option value="corporate">法人</option>
              <option value="individual">個人</option>
            </select>
            {errors.customer_type && (
              <p className="mt-1 text-sm text-red-600">{errors.customer_type}</p>
            )}
          </div>

          <div className="mb-4">
            <label className="block mb-2">法人番号</label>
            <input
              type="text"
              value={formData.corporation_number}
              onChange={(e) => setFormData({ ...formData, corporation_number: e.target.value })}
              onBlur={() => handleFieldBlur("corporation_number")}
              className={`w-full px-4 py-2 border rounded ${
                errors.corporation_number ? "border-red-500" : "border-gray-300"
              }`}
              placeholder="13桁の数字"
            />
            {errors.corporation_number && (
              <p className="mt-1 text-sm text-red-600">{errors.corporation_number}</p>
            )}
          </div>

          <div className="mb-4">
            <label className="block mb-2">
              掛率 <span className="text-red-600">*</span>
              <span
                className="ml-2 text-blue-600 cursor-help"
                title="請求金額計算時に適用される掛け率です（例: 90%の場合、請求額 = 工数×単価×0.9）"
              >
                ℹ️
              </span>
            </label>
            <input
              type="number"
              value={formData.rate_percent}
              onChange={(e) => setFormData({ ...formData, rate_percent: e.target.value })}
              onBlur={() => handleFieldBlur("rate_percent")}
              className={`w-full px-4 py-2 border rounded ${
                errors.rate_percent ? "border-red-500" : "border-gray-300"
              }`}
              min="0"
              max="300"
            />
            {errors.rate_percent && (
              <p className="mt-1 text-sm text-red-600">{errors.rate_percent}</p>
            )}
          </div>

          <div className="mb-4">
            <label className="block mb-2">概要</label>
            <textarea
              value={formData.note}
              onChange={(e) => setFormData({ ...formData, note: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded"
              rows={3}
              placeholder="備考やメモを入力"
            />
          </div>
        </div>

        <div className="flex gap-4">
          <button
            onClick={() => navigate(`/admin/customers/${id}`)}
            className="px-6 py-2 border border-gray-300 rounded hover:bg-gray-100 transition-colors"
          >
            キャンセル
          </button>
          <button
            onClick={() => setShowConfirmModal(true)}
            disabled={!isFormValid() || changes.length === 0}
            className={`px-6 py-2 rounded transition-colors ${
              isFormValid() && changes.length > 0
                ? "bg-blue-600 hover:bg-blue-700 text-white"
                : "bg-gray-300 text-gray-500 cursor-not-allowed"
            }`}
          >
            更新
          </button>
        </div>
      </div>

      {/* 更新確認モーダル */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold">顧客の更新確認</h3>
              <button
                onClick={() => setShowConfirmModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✗
              </button>
            </div>

            <p className="mb-4">以下の内容で更新します。よろしいですか？</p>

            <div className="mb-6">
              <h4 className="font-bold mb-2">【変更内容】</h4>
              <div className="bg-gray-50 p-4 rounded">
                {changes.length === 0 ? (
                  <p className="text-gray-500">変更はありません</p>
                ) : (
                  changes.map((change, index) => (
                    <p key={index} className="mb-2">
                      <span className="font-semibold">{change.field}:</span> {change.oldValue} →{" "}
                      {change.newValue}
                    </p>
                  ))
                )}
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowConfirmModal(false)}
                disabled={submitting}
                className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-100 transition-colors"
              >
                戻る
              </button>
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors disabled:bg-gray-300"
              >
                {submitting ? "更新中..." : "更新する"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
