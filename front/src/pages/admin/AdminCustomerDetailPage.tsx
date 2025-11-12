import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { httpClient } from "../../api/mutator";
import type { Customer, Site } from "../../api/generated/timesheetAPI.schemas";
import { useToast } from "../../hooks/useToast";
import { Toast } from "../../components/Toast";

interface CustomerDetailResponse {
  customer: Customer;
  sites: Site[];
}

interface SiteFormData {
  name: string;
  note: string;
}

export function AdminCustomerDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [sites, setSites] = useState<Site[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [addSiteModal, setAddSiteModal] = useState(false);
  const [editSiteModal, setEditSiteModal] = useState<{ open: boolean; site: Site | null }>({
    open: false,
    site: null,
  });
  const [deleteSiteModal, setDeleteSiteModal] = useState<{ open: boolean; site: Site | null }>({
    open: false,
    site: null,
  });
  const [siteFormData, setSiteFormData] = useState<SiteFormData>({ name: "", note: "" });
  const [siteFormError, setSiteFormError] = useState("");
  const [showDiscardedSites, setShowDiscardedSites] = useState(false);
  const { toasts, showToast, removeToast } = useToast();

  const fetchCustomerDetail = useCallback(async () => {
    if (!id) return;

    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams();
      if (showDiscardedSites) params.append("show_discarded", "true");

      const response = await httpClient<CustomerDetailResponse>({
        url: `/admin/customers/${id}?${params.toString()}`,
      });
      setCustomer(response.customer);
      setSites(response.sites);
    } catch (err) {
      setError("顧客情報の取得に失敗しました");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [id, showDiscardedSites]);

  useEffect(() => {
    fetchCustomerDetail();
  }, [fetchCustomerDetail]);

  const getCustomerTypeLabel = (type: string) => {
    return type === "corporate" ? "法人" : "個人";
  };

  const handleAddSite = async () => {
    if (!siteFormData.name.trim()) {
      setSiteFormError("現場名を入力してください");
      return;
    }

    try {
      await httpClient({
        url: "/admin/sites",
        method: "POST",
        data: {
          site: {
            customer_id: id,
            name: siteFormData.name,
            note: siteFormData.note || undefined,
          },
        },
      });
      setAddSiteModal(false);
      setSiteFormData({ name: "", note: "" });
      setSiteFormError("");
      showToast("現場を追加しました", "success");
      fetchCustomerDetail();
    } catch (err) {
      setSiteFormError("現場の追加に失敗しました");
      console.error(err);
    }
  };

  const openAddSiteModal = () => {
    setSiteFormData({ name: "", note: "" });
    setSiteFormError("");
    setAddSiteModal(true);
  };

  const openEditSiteModal = (site: Site) => {
    setSiteFormData({ name: site.name, note: site.note || "" });
    setSiteFormError("");
    setEditSiteModal({ open: true, site });
  };

  const handleEditSite = async () => {
    if (!editSiteModal.site) return;
    if (!siteFormData.name.trim()) {
      setSiteFormError("現場名を入力してください");
      return;
    }

    try {
      await httpClient({
        url: `/admin/sites/${editSiteModal.site.id}`,
        method: "PATCH",
        data: {
          site: {
            name: siteFormData.name,
            note: siteFormData.note || undefined,
          },
        },
      });
      setEditSiteModal({ open: false, site: null });
      setSiteFormData({ name: "", note: "" });
      setSiteFormError("");
      showToast("現場を更新しました", "success");
      fetchCustomerDetail();
    } catch (err) {
      setSiteFormError("現場の更新に失敗しました");
      console.error(err);
    }
  };

  const handleDeleteSite = async () => {
    if (!deleteSiteModal.site) return;

    try {
      await httpClient({
        url: `/admin/sites/${deleteSiteModal.site.id}`,
        method: "DELETE",
      });
      setDeleteSiteModal({ open: false, site: null });
      showToast("現場を削除しました", "success");
      fetchCustomerDetail();
    } catch (err) {
      showToast("現場の削除に失敗しました", "error");
      console.error(err);
    }
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
      <Toast toasts={toasts} onRemove={removeToast} />

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
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-bold">現場一覧</h3>
            <button
              onClick={openAddSiteModal}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded transition-colors"
            >
              + 現場を追加
            </button>
          </div>

          {/* 削除済み現場表示切り替え */}
          <div className="mb-4">
            <label className="flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={showDiscardedSites}
                onChange={(e) => setShowDiscardedSites(e.target.checked)}
                className="mr-2 w-4 h-4 cursor-pointer"
              />
              <span className="text-sm">削除済みの現場を表示</span>
            </label>
          </div>

          {sites.length === 0 ? (
            <div className="text-center py-8 text-gray-500">現場が登録されていません</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse bg-white shadow rounded">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border border-gray-300 px-4 py-2 text-left">現場名</th>
                    <th className="border border-gray-300 px-4 py-2 text-left">概要</th>
                    <th className="border border-gray-300 px-4 py-2 text-center w-24">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {sites.map((site) => {
                    const isDiscarded = !!site.discarded_at;
                    return (
                      <tr
                        key={site.id}
                        className={isDiscarded ? "bg-gray-200" : "hover:bg-gray-50"}
                      >
                        <td className="border border-gray-300 px-4 py-2">
                          {isDiscarded ? (
                            <span className="text-gray-600 flex items-center gap-1">
                              <div className="i-heroicons-trash w-4 h-4" />
                              {site.name}
                            </span>
                          ) : (
                            site.name
                          )}
                        </td>
                        <td className="border border-gray-300 px-4 py-2">{site.note || "-"}</td>
                        <td className="border border-gray-300 px-4 py-2 text-center">
                          {isDiscarded ? (
                            <span className="text-gray-600 text-sm">削除済</span>
                          ) : (
                            <>
                              <button
                                onClick={() => openEditSiteModal(site)}
                                className="text-blue-600 hover:text-blue-800 transition-colors mr-3"
                                title="編集"
                                aria-label={`${site.name}を編集`}
                              >
                                <div className="i-heroicons-pencil-square w-5 h-5" />
                              </button>
                              <button
                                onClick={() => setDeleteSiteModal({ open: true, site })}
                                className="text-red-600 hover:text-red-800 transition-colors"
                                title="削除"
                                aria-label={`${site.name}を削除`}
                              >
                                <div className="i-heroicons-trash w-5 h-5" />
                              </button>
                            </>
                          )}
                        </td>
                      </tr>
                    );
                  })}
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

      {/* 現場追加モーダル */}
      {addSiteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold">現場の追加</h3>
              <button
                onClick={() => setAddSiteModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <div className="i-heroicons-x-mark w-6 h-6" />
              </button>
            </div>

            {siteFormError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded">
                {siteFormError}
              </div>
            )}

            <div className="mb-4">
              <label className="block text-sm font-semibold mb-2">
                現場名 <span className="text-red-600">*</span>
              </label>
              <input
                type="text"
                value={siteFormData.name}
                onChange={(e) => setSiteFormData({ ...siteFormData, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="例: 〇〇市役所"
              />
            </div>

            <div className="mb-6">
              <label className="block text-sm font-semibold mb-2">概要</label>
              <textarea
                value={siteFormData.note}
                onChange={(e) => setSiteFormData({ ...siteFormData, note: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
                placeholder="例: エアコン外気復旧工事"
              />
            </div>

            <div className="flex justify-end gap-2">
              <button
                onClick={() => setAddSiteModal(false)}
                className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-100 transition-colors"
              >
                キャンセル
              </button>
              <button
                onClick={handleAddSite}
                disabled={!siteFormData.name.trim()}
                className={`px-4 py-2 rounded transition-colors ${
                  siteFormData.name.trim()
                    ? "bg-green-600 hover:bg-green-700 text-white"
                    : "bg-gray-300 text-gray-500 cursor-not-allowed"
                }`}
              >
                追加する
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 現場編集モーダル */}
      {editSiteModal.open && editSiteModal.site && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold">現場の編集</h3>
              <button
                onClick={() => setEditSiteModal({ open: false, site: null })}
                className="text-gray-500 hover:text-gray-700"
              >
                <div className="i-heroicons-x-mark w-6 h-6" />
              </button>
            </div>

            {siteFormError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded">
                {siteFormError}
              </div>
            )}

            <div className="mb-4">
              <label className="block text-sm font-semibold mb-2">
                現場名 <span className="text-red-600">*</span>
              </label>
              <input
                type="text"
                value={siteFormData.name}
                onChange={(e) => setSiteFormData({ ...siteFormData, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="例: 〇〇市役所"
              />
            </div>

            <div className="mb-6">
              <label className="block text-sm font-semibold mb-2">概要</label>
              <textarea
                value={siteFormData.note}
                onChange={(e) => setSiteFormData({ ...siteFormData, note: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
                placeholder="例: エアコン外気復旧工事"
              />
            </div>

            <div className="flex justify-end gap-2">
              <button
                onClick={() => setEditSiteModal({ open: false, site: null })}
                className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-100 transition-colors"
              >
                キャンセル
              </button>
              <button
                onClick={handleEditSite}
                disabled={!siteFormData.name.trim()}
                className={`px-4 py-2 rounded transition-colors ${
                  siteFormData.name.trim()
                    ? "bg-blue-600 hover:bg-blue-700 text-white"
                    : "bg-gray-300 text-gray-500 cursor-not-allowed"
                }`}
              >
                更新する
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 現場削除確認モーダル */}
      {deleteSiteModal.open && deleteSiteModal.site && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold">現場の削除</h3>
              <button
                onClick={() => setDeleteSiteModal({ open: false, site: null })}
                className="text-gray-500 hover:text-gray-700"
              >
                <div className="i-heroicons-x-mark w-6 h-6" />
              </button>
            </div>
            <p className="mb-4">「{deleteSiteModal.site.name}」を削除しますか？</p>
            <p className="mb-4 text-sm text-gray-600">※削除後も日報データは保持されます。</p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setDeleteSiteModal({ open: false, site: null })}
                className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-100 transition-colors"
              >
                キャンセル
              </button>
              <button
                onClick={handleDeleteSite}
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
