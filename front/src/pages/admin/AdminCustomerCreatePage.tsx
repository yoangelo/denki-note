import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { httpClient } from "../../api/mutator";

interface Site {
  name: string;
  note: string;
}

interface FormErrors {
  name?: string;
  customer_type?: string;
  corporation_number?: string;
  rate_percent?: string;
  sites?: { [key: number]: { name?: string } };
}

export function AdminCustomerCreatePage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    customer_type: "",
    corporation_number: "",
    rate_percent: "100",
    note: "",
  });

  const [sites, setSites] = useState<Site[]>([]);
  const [errors, setErrors] = useState<FormErrors>({});

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

  const validateSiteName = (value: string): string | undefined => {
    if (!value.trim()) {
      return "現場名を入力してください";
    }
    return undefined;
  };

  const handleCustomerFieldBlur = (field: keyof typeof formData) => {
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

  const handleSiteFieldBlur = (index: number, field: keyof Site) => {
    if (field === "name") {
      const error = validateSiteName(sites[index].name);
      setErrors((prev) => ({
        ...prev,
        sites: {
          ...prev.sites,
          [index]: { ...prev.sites?.[index], name: error },
        },
      }));
    }
  };

  const addSite = () => {
    setSites([...sites, { name: "", note: "" }]);
  };

  const removeSite = (index: number) => {
    setSites(sites.filter((_, i) => i !== index));
    const newSiteErrors = { ...errors.sites };
    delete newSiteErrors[index];
    const reindexed: { [key: number]: { name?: string } } = {};
    Object.keys(newSiteErrors).forEach((key) => {
      const oldIndex = parseInt(key);
      if (oldIndex > index) {
        reindexed[oldIndex - 1] = newSiteErrors[oldIndex];
      } else {
        reindexed[oldIndex] = newSiteErrors[oldIndex];
      }
    });
    setErrors((prev) => ({ ...prev, sites: reindexed }));
  };

  const updateSite = (index: number, field: keyof Site, value: string) => {
    const newSites = [...sites];
    newSites[index][field] = value;
    setSites(newSites);
  };

  const isCustomerFormValid = () => {
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

  const isSitesValid = () => {
    if (sites.length === 0) return true;
    return sites.every((site, index) => {
      return site.name.trim() !== "" && !errors.sites?.[index]?.name;
    });
  };

  const isFormValid = () => {
    return isCustomerFormValid() && isSitesValid();
  };

  const handleSubmit = async () => {
    setLoading(true);
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
        sites?: Array<{
          name: string;
          note?: string;
        }>;
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

      if (sites.length > 0) {
        payload.sites = sites.map((site) => ({
          name: site.name,
          note: site.note || undefined,
        }));
      }

      await httpClient({
        url: "/admin/customers/create_bulk",
        method: "POST",
        data: payload,
      });

      navigate("/admin/customers");
    } catch (err: unknown) {
      setError("顧客の作成に失敗しました");
      console.error(err);
    } finally {
      setLoading(false);
      setShowConfirmModal(false);
    }
  };

  const getCustomerTypeLabel = (type: string) => {
    if (type === "corporate") return "法人";
    if (type === "individual") return "個人";
    return type;
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">顧客の新規作成</h2>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded">{error}</div>
      )}

      <div className="max-w-2xl">
        {/* 顧客情報 */}
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
              onBlur={() => handleCustomerFieldBlur("name")}
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
              onBlur={() => handleCustomerFieldBlur("customer_type")}
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
              onBlur={() => handleCustomerFieldBlur("corporation_number")}
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
              onBlur={() => handleCustomerFieldBlur("rate_percent")}
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

        {/* 紐づける現場 */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-bold">紐づける現場</h3>
            <button
              onClick={addSite}
              disabled={!isCustomerFormValid()}
              className={`px-4 py-2 rounded transition-colors ${
                isCustomerFormValid()
                  ? "bg-green-600 hover:bg-green-700 text-white"
                  : "bg-gray-300 text-gray-500 cursor-not-allowed"
              }`}
            >
              + 現場を追加
            </button>
          </div>

          {sites.map((site, index) => (
            <div key={index} className="mb-4 p-4 border border-gray-300 rounded relative">
              <button
                onClick={() => removeSite(index)}
                className="absolute top-2 right-2 text-red-600 hover:text-red-800"
              >
                削除
              </button>

              <div className="mb-4">
                <label className="block mb-2">
                  現場名 <span className="text-red-600">*</span>
                </label>
                <input
                  type="text"
                  value={site.name}
                  onChange={(e) => updateSite(index, "name", e.target.value)}
                  onBlur={() => handleSiteFieldBlur(index, "name")}
                  className={`w-full px-4 py-2 border rounded ${
                    errors.sites?.[index]?.name ? "border-red-500" : "border-gray-300"
                  }`}
                  placeholder="例: 〇〇市役所"
                />
                {errors.sites?.[index]?.name && (
                  <p className="mt-1 text-sm text-red-600">{errors.sites[index].name}</p>
                )}
              </div>

              <div className="mb-2">
                <label className="block mb-2">概要</label>
                <textarea
                  value={site.note}
                  onChange={(e) => updateSite(index, "note", e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded"
                  rows={2}
                  placeholder="備考やメモを入力"
                />
              </div>
            </div>
          ))}
        </div>

        {/* アクションボタン */}
        <div className="flex gap-4">
          <button
            onClick={() => navigate("/admin/customers")}
            className="px-6 py-2 border border-gray-300 rounded hover:bg-gray-100 transition-colors"
          >
            キャンセル
          </button>
          <button
            onClick={() => setShowConfirmModal(true)}
            disabled={!isFormValid()}
            className={`px-6 py-2 rounded transition-colors ${
              isFormValid()
                ? "bg-blue-600 hover:bg-blue-700 text-white"
                : "bg-gray-300 text-gray-500 cursor-not-allowed"
            }`}
          >
            作成
          </button>
        </div>
      </div>

      {/* 作成確認モーダル */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold">顧客の作成確認</h3>
              <button
                onClick={() => setShowConfirmModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✗
              </button>
            </div>

            <p className="mb-4">以下の内容で作成します。よろしいですか？</p>

            <div className="mb-6">
              <h4 className="font-bold mb-2">【顧客情報】</h4>
              <div className="bg-gray-50 p-4 rounded">
                <p>
                  <span className="font-semibold">顧客名:</span> {formData.name}
                </p>
                <p>
                  <span className="font-semibold">企業区分:</span>{" "}
                  {getCustomerTypeLabel(formData.customer_type)}
                </p>
                <p>
                  <span className="font-semibold">法人番号:</span>{" "}
                  {formData.corporation_number || "（なし）"}
                </p>
                <p>
                  <span className="font-semibold">掛率:</span> {formData.rate_percent}%
                </p>
                <p>
                  <span className="font-semibold">概要:</span> {formData.note || "（なし）"}
                </p>
              </div>
            </div>

            {sites.length > 0 && (
              <div className="mb-6">
                <h4 className="font-bold mb-2">【現場】</h4>
                <div className="bg-gray-50 p-4 rounded">
                  <ul className="list-disc list-inside">
                    {sites.map((site, index) => (
                      <li key={index}>
                        {site.name}
                        {site.note && ` (${site.note})`}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowConfirmModal(false)}
                disabled={loading}
                className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-100 transition-colors"
              >
                戻る
              </button>
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors disabled:bg-gray-300"
              >
                {loading ? "作成中..." : "作成する"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
