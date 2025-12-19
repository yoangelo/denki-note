import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { httpClient } from "../../api/mutator";
import type { TenantSettings } from "../../api/generated/timesheetAPI.schemas";
import { UpdateConfirmModal, type DataRecord } from "../../components/ui";

interface TenantResponse {
  tenant: TenantSettings;
}

interface FormData {
  name: string;
  postal_code: string;
  address: string;
  phone_1: string;
  phone_2: string;
  phone_3: string;
  fax_1: string;
  fax_2: string;
  fax_3: string;
  corporate_number: string;
  representative_name: string;
  default_unit_rate: string;
  money_rounding: string;
}

const parsePhoneNumber = (phone: string | null | undefined): [string, string, string] => {
  if (!phone) return ["", "", ""];
  const parts = phone.split("-");
  return [parts[0] || "", parts[1] || "", parts[2] || ""];
};

const formatPhoneNumber = (phone1: string, phone2: string, phone3: string): string | null => {
  if (!phone1 && !phone2 && !phone3) return null;
  return `${phone1}-${phone2}-${phone3}`;
};

const parsePostalCode = (postalCode: string | null | undefined): string => {
  if (!postalCode) return "";
  return postalCode.replace(/-/g, "");
};

const formatPostalCode = (postalCode: string): string | null => {
  if (!postalCode) return null;
  const digits = postalCode.replace(/-/g, "");
  if (digits.length === 7) {
    return `${digits.slice(0, 3)}-${digits.slice(3)}`;
  }
  return digits;
};

interface FormErrors {
  name?: string;
  default_unit_rate?: string;
}

const MONEY_ROUNDING_OPTIONS = [
  { value: "round", label: "四捨五入" },
  { value: "ceil", label: "切り上げ" },
  { value: "floor", label: "切り捨て" },
];

export function AdminTenantSettingsEditPage() {
  const navigate = useNavigate();
  const [originalTenant, setOriginalTenant] = useState<TenantSettings | null>(null);
  const [formData, setFormData] = useState<FormData>({
    name: "",
    postal_code: "",
    address: "",
    phone_1: "",
    phone_2: "",
    phone_3: "",
    fax_1: "",
    fax_2: "",
    fax_3: "",
    corporate_number: "",
    representative_name: "",
    default_unit_rate: "",
    money_rounding: "round",
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState(true);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchTenant = async () => {
      setLoading(true);
      try {
        const response = await httpClient<TenantResponse>({
          url: "/admin/tenant",
        });
        setOriginalTenant(response.tenant);
        const [phone1, phone2, phone3] = parsePhoneNumber(response.tenant.phone_number);
        const [fax1, fax2, fax3] = parsePhoneNumber(response.tenant.fax_number);
        setFormData({
          name: response.tenant.name,
          postal_code: parsePostalCode(response.tenant.postal_code),
          address: response.tenant.address || "",
          phone_1: phone1,
          phone_2: phone2,
          phone_3: phone3,
          fax_1: fax1,
          fax_2: fax2,
          fax_3: fax3,
          corporate_number: response.tenant.corporate_number || "",
          representative_name: response.tenant.representative_name || "",
          default_unit_rate: String(response.tenant.default_unit_rate),
          money_rounding: response.tenant.money_rounding,
        });
      } catch (err) {
        toast.error("自社設定の取得に失敗しました");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchTenant();
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
    const [origPhone1, origPhone2, origPhone3] = parsePhoneNumber(originalTenant.phone_number);
    const [origFax1, origFax2, origFax3] = parsePhoneNumber(originalTenant.fax_number);
    return (
      formData.name !== originalTenant.name ||
      formData.postal_code !== parsePostalCode(originalTenant.postal_code) ||
      formData.address !== (originalTenant.address || "") ||
      formData.phone_1 !== origPhone1 ||
      formData.phone_2 !== origPhone2 ||
      formData.phone_3 !== origPhone3 ||
      formData.fax_1 !== origFax1 ||
      formData.fax_2 !== origFax2 ||
      formData.fax_3 !== origFax3 ||
      formData.corporate_number !== (originalTenant.corporate_number || "") ||
      formData.representative_name !== (originalTenant.representative_name || "") ||
      Number(formData.default_unit_rate) !== originalTenant.default_unit_rate ||
      formData.money_rounding !== originalTenant.money_rounding
    );
  };

  const hasErrors = (): boolean => {
    return Object.values(errors).some((error) => error !== undefined);
  };

  const getOldData = (): DataRecord[] => {
    if (!originalTenant) return [];

    const fromRoundingLabel =
      MONEY_ROUNDING_OPTIONS.find((o) => o.value === originalTenant.money_rounding)?.label ||
      originalTenant.money_rounding;

    return [
      { fieldName: "自社名", value: originalTenant.name },
      { fieldName: "郵便番号", value: originalTenant.postal_code || "-" },
      { fieldName: "住所", value: originalTenant.address || "-" },
      { fieldName: "電話番号", value: originalTenant.phone_number || "-" },
      { fieldName: "FAX番号", value: originalTenant.fax_number || "-" },
      { fieldName: "登録番号", value: originalTenant.corporate_number || "-" },
      { fieldName: "代表者名", value: originalTenant.representative_name || "-" },
      {
        fieldName: "基本時間単価",
        value: `${new Intl.NumberFormat("ja-JP").format(originalTenant.default_unit_rate)}円`,
      },
      { fieldName: "金額丸め方式", value: fromRoundingLabel },
    ];
  };

  const getNewData = (): DataRecord[] => {
    const toRoundingLabel =
      MONEY_ROUNDING_OPTIONS.find((o) => o.value === formData.money_rounding)?.label ||
      formData.money_rounding;

    const formattedPostalCode = formatPostalCode(formData.postal_code);
    const formattedPhoneNumber = formatPhoneNumber(
      formData.phone_1,
      formData.phone_2,
      formData.phone_3
    );
    const formattedFaxNumber = formatPhoneNumber(formData.fax_1, formData.fax_2, formData.fax_3);

    return [
      { fieldName: "自社名", value: formData.name },
      { fieldName: "郵便番号", value: formattedPostalCode || "-" },
      { fieldName: "住所", value: formData.address || "-" },
      { fieldName: "電話番号", value: formattedPhoneNumber || "-" },
      { fieldName: "FAX番号", value: formattedFaxNumber || "-" },
      { fieldName: "登録番号", value: formData.corporate_number || "-" },
      { fieldName: "代表者名", value: formData.representative_name || "-" },
      {
        fieldName: "基本時間単価",
        value: `${new Intl.NumberFormat("ja-JP").format(Number(formData.default_unit_rate))}円`,
      },
      { fieldName: "金額丸め方式", value: toRoundingLabel },
    ];
  };

  const handleSubmitClick = () => {
    const newErrors: FormErrors = {};
    newErrors.name = validateField("name", formData.name);
    newErrors.default_unit_rate = validateField("default_unit_rate", formData.default_unit_rate);

    setErrors(newErrors);

    if (Object.values(newErrors).some((error) => error !== undefined)) {
      return;
    }

    setShowConfirmModal(true);
  };

  const handleConfirmUpdate = async () => {
    setIsSubmitting(true);
    try {
      await httpClient<TenantResponse>({
        url: "/admin/tenant",
        method: "PATCH",
        data: {
          tenant: {
            name: formData.name,
            postal_code: formatPostalCode(formData.postal_code),
            address: formData.address || null,
            phone_number: formatPhoneNumber(formData.phone_1, formData.phone_2, formData.phone_3),
            fax_number: formatPhoneNumber(formData.fax_1, formData.fax_2, formData.fax_3),
            corporate_number: formData.corporate_number || null,
            representative_name: formData.representative_name || null,
            default_unit_rate: Number(formData.default_unit_rate),
            money_rounding: formData.money_rounding,
          },
        },
      });
      toast.success("設定を更新しました");
      setShowConfirmModal(false);
      navigate("/admin/settings");
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
      toast.error("設定の更新に失敗しました");
      setShowConfirmModal(false);
      console.error(err);
    } finally {
      setIsSubmitting(false);
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
                    className={`w-full px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.name ? "border-red-500" : "border-gray-300"
                    }`}
                  />
                  {errors.name && <p className="mt-1 text-sm text-red-500">{errors.name}</p>}
                </div>

                <div>
                  <label
                    htmlFor="postal_code"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    郵便番号
                  </label>
                  <input
                    type="text"
                    id="postal_code"
                    value={formData.postal_code}
                    onChange={(e) => {
                      const value = e.target.value.replace(/[^0-9]/g, "").slice(0, 7);
                      setFormData({ ...formData, postal_code: value });
                    }}
                    placeholder="1234567"
                    maxLength={7}
                    className="w-48 px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="mt-1 text-xs text-gray-500">ハイフンは自動で付与されます</p>
                </div>

                <div>
                  <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">
                    住所
                  </label>
                  <input
                    type="text"
                    id="address"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    placeholder="例: 東京都渋谷区○○1-2-3"
                    className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">電話番号</label>
                  <div className="flex items-center gap-1">
                    <input
                      type="tel"
                      id="phone_1"
                      value={formData.phone_1}
                      onChange={(e) => {
                        const value = e.target.value.replace(/[^0-9]/g, "").slice(0, 5);
                        setFormData({ ...formData, phone_1: value });
                      }}
                      placeholder="03"
                      maxLength={5}
                      className="w-20 px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-center"
                    />
                    <span className="text-gray-500">-</span>
                    <input
                      type="tel"
                      id="phone_2"
                      value={formData.phone_2}
                      onChange={(e) => {
                        const value = e.target.value.replace(/[^0-9]/g, "").slice(0, 4);
                        setFormData({ ...formData, phone_2: value });
                      }}
                      placeholder="1234"
                      maxLength={4}
                      className="w-20 px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-center"
                    />
                    <span className="text-gray-500">-</span>
                    <input
                      type="tel"
                      id="phone_3"
                      value={formData.phone_3}
                      onChange={(e) => {
                        const value = e.target.value.replace(/[^0-9]/g, "").slice(0, 4);
                        setFormData({ ...formData, phone_3: value });
                      }}
                      placeholder="5678"
                      maxLength={4}
                      className="w-20 px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-center"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">FAX番号</label>
                  <div className="flex items-center gap-1">
                    <input
                      type="tel"
                      id="fax_1"
                      value={formData.fax_1}
                      onChange={(e) => {
                        const value = e.target.value.replace(/[^0-9]/g, "").slice(0, 5);
                        setFormData({ ...formData, fax_1: value });
                      }}
                      placeholder="03"
                      maxLength={5}
                      className="w-20 px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-center"
                    />
                    <span className="text-gray-500">-</span>
                    <input
                      type="tel"
                      id="fax_2"
                      value={formData.fax_2}
                      onChange={(e) => {
                        const value = e.target.value.replace(/[^0-9]/g, "").slice(0, 4);
                        setFormData({ ...formData, fax_2: value });
                      }}
                      placeholder="1234"
                      maxLength={4}
                      className="w-20 px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-center"
                    />
                    <span className="text-gray-500">-</span>
                    <input
                      type="tel"
                      id="fax_3"
                      value={formData.fax_3}
                      onChange={(e) => {
                        const value = e.target.value.replace(/[^0-9]/g, "").slice(0, 4);
                        setFormData({ ...formData, fax_3: value });
                      }}
                      placeholder="5678"
                      maxLength={4}
                      className="w-20 px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-center"
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="corporate_number"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    登録番号（インボイス）
                  </label>
                  <input
                    type="text"
                    id="corporate_number"
                    value={formData.corporate_number}
                    onChange={(e) => setFormData({ ...formData, corporate_number: e.target.value })}
                    placeholder="例: T1234567890123"
                    className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label
                    htmlFor="representative_name"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    代表者名
                  </label>
                  <input
                    type="text"
                    id="representative_name"
                    value={formData.representative_name}
                    onChange={(e) =>
                      setFormData({ ...formData, representative_name: e.target.value })
                    }
                    placeholder="例: 山田 太郎"
                    className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
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
                    <div
                      className="i-heroicons-information-circle ml-2 w-4 h-4 text-gray-400 cursor-help"
                      title="日報入力時の単価初期値として使用されます。作業者ごとに異なる単価を設定することも可能です。"
                    />
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
                      className={`w-full px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 ${
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
                    htmlFor="money_rounding"
                    className="flex items-center text-sm font-medium text-gray-700 mb-1"
                  >
                    金額丸め方式 <span className="text-red-500 ml-1">*</span>
                    <div
                      className="i-heroicons-information-circle ml-2 w-4 h-4 text-gray-400 cursor-help"
                      title="請求金額計算時の端数処理方法です。&#10;・四捨五入: 0.5未満切り捨て、0.5以上切り上げ&#10;・切り上げ: 常に切り上げ&#10;・切り捨て: 常に切り捨て"
                    />
                  </label>
                  <select
                    id="money_rounding"
                    value={formData.money_rounding}
                    onChange={(e) => setFormData({ ...formData, money_rounding: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-100 transition-colors"
              >
                キャンセル
              </button>
              <button
                onClick={handleSubmitClick}
                disabled={!hasChanges() || hasErrors()}
                className={`px-4 py-2 rounded text-white transition-colors ${
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

      <UpdateConfirmModal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        onConfirm={handleConfirmUpdate}
        title="設定の更新確認"
        description="以下の内容で更新します。よろしいですか？"
        newDatas={getNewData()}
        oldDatas={getOldData()}
        confirmText="更新する"
        isSubmitting={isSubmitting}
      />
    </div>
  );
}
