import { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { CustomerSiteSelector } from "@/components/CustomerSiteSelector";
import { WorkerSelect } from "@/components/WorkerSelect";
import { TimeInput } from "@/components/TimeInput";
import { useAuthStore } from "@/stores/authStore";
import { ConfirmModal, UpdateConfirmModal, type DataRecord } from "@/components/ui";
import {
  useGetDailyReport,
  useBulkUpdateDailyReport,
  useDestroyDailyReport,
} from "@/api/generated/daily-reports/daily-reports";
import { useListUsers } from "@/api/generated/users/users";
import { format } from "date-fns";
import { ja } from "date-fns/locale";

export function DailyReportEditPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const user = useAuthStore((state) => state.user);
  const isAdmin = user?.is_admin || false;

  // Admin権限がない場合はリダイレクト
  useEffect(() => {
    if (!isAdmin) {
      navigate("/list");
    }
  }, [isAdmin, navigate]);

  const { data: dailyReportData, isLoading } = useGetDailyReport(id!);
  const { data: users = [] } = useListUsers({ is_active: true });

  const [customerId, setCustomerId] = useState("");
  const [siteId, setSiteId] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [siteName, setSiteName] = useState("");
  const [summary, setSummary] = useState("");
  const [selectedWorkers, setSelectedWorkers] = useState<string[]>([]);
  const [workerHours, setWorkerHours] = useState<Record<string, number>>({});
  const [showWorkerSelect, setShowWorkerSelect] = useState(false);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // 初期データ保持用
  const [initialCustomerName, setInitialCustomerName] = useState("");
  const [initialSiteName, setInitialSiteName] = useState("");
  const [initialSummary, setInitialSummary] = useState("");
  const [initialSelectedWorkers, setInitialSelectedWorkers] = useState<string[]>([]);
  const [initialWorkerHours, setInitialWorkerHours] = useState<Record<string, number>>({});

  const bulkUpdate = useBulkUpdateDailyReport({
    mutation: {
      onSuccess: async () => {
        // キャッシュを無効化して日報一覧を更新
        await Promise.all([
          queryClient.invalidateQueries({
            queryKey: ["/daily_reports"],
            exact: false,
          }),
          queryClient.invalidateQueries({
            queryKey: ["/summaries/customer-month"],
            exact: false,
          }),
        ]);

        toast.success("日報を更新しました");
        navigate("/list");
      },
      onError: () => {
        toast.error("日報の更新に失敗しました");
      },
    },
  });

  const destroy = useDestroyDailyReport({
    mutation: {
      onSuccess: async () => {
        // キャッシュを無効化して日報一覧を更新
        await Promise.all([
          queryClient.invalidateQueries({
            queryKey: ["/daily_reports"],
            exact: false,
          }),
          queryClient.invalidateQueries({
            queryKey: ["/summaries/customer-month"],
            exact: false,
          }),
        ]);

        toast.success("日報を削除しました");
        navigate("/list");
      },
      onError: () => {
        toast.error("日報の削除に失敗しました");
      },
    },
  });

  // データが取得できたら初期値を設定
  useEffect(() => {
    if (dailyReportData?.daily_report) {
      const report = dailyReportData.daily_report;

      // 現在の値を設定
      setCustomerId(report.customer.id);
      setSiteId(report.site.id);
      setCustomerName(report.customer.name);
      setSiteName(report.site.name);
      setSummary(report.summary);

      const workers = report.work_entries.map((entry) => entry.user.id);
      setSelectedWorkers(workers);

      const hours: Record<string, number> = {};
      report.work_entries.forEach((entry) => {
        hours[entry.user.id] = entry.minutes / 60;
      });
      setWorkerHours(hours);

      // 初期値を保存
      setInitialCustomerName(report.customer.name);
      setInitialSiteName(report.site.name);
      setInitialSummary(report.summary);
      setInitialSelectedWorkers(workers);
      setInitialWorkerHours(hours);
    }
  }, [dailyReportData]);

  const handleCustomerSiteSelect = (data: {
    customerId: string;
    siteId: string;
    customerName?: string;
    siteName?: string;
    customerType?: "corporate" | "individual";
  }) => {
    setCustomerId(data.customerId);
    setSiteId(data.siteId);
    setCustomerName(data.customerName || "");
    setSiteName(data.siteName || "");
  };

  const handleWorkersChange = (workers: string[]) => {
    setSelectedWorkers(workers);
    // 選択解除された作業者の時間をクリア
    const newHours = { ...workerHours };
    Object.keys(newHours).forEach((workerId) => {
      if (!workers.includes(workerId)) {
        delete newHours[workerId];
      }
    });
    setWorkerHours(newHours);
    setShowWorkerSelect(false);
  };

  const updateWorkerHours = (workerId: string, hours: number) => {
    setWorkerHours((prev) => ({ ...prev, [workerId]: hours }));
  };

  const calculateTotalHours = () => {
    return Object.values(workerHours).reduce((sum, hours) => sum + hours, 0);
  };

  const isFormValid = useMemo(() => {
    return (
      siteId &&
      summary.trim() &&
      selectedWorkers.length > 0 &&
      Object.values(workerHours).some((hours) => hours > 0)
    );
  }, [siteId, summary, selectedWorkers, workerHours]);

  const handleUpdate = () => {
    if (!isFormValid || !id) return;

    const workEntries = selectedWorkers
      .filter((workerId) => (workerHours[workerId] || 0) > 0)
      .map((workerId) => ({
        user_id: workerId,
        minutes: Math.round((workerHours[workerId] || 0) * 60),
      }));

    bulkUpdate.mutate({
      id,
      data: {
        daily_report: {
          site_id: siteId,
          summary,
          work_entries: workEntries,
        },
      },
    });
    setShowUpdateModal(false);
  };

  const handleDelete = () => {
    if (!id) return;
    destroy.mutate({ id });
    setShowDeleteModal(false);
  };

  const selectedWorkerNames = useMemo(() => {
    return users
      .filter((u) => selectedWorkers.includes(u.id))
      .map((u) => u.display_name)
      .join(", ");
  }, [users, selectedWorkers]);

  const getOldUpdateData = (): DataRecord[] => {
    const initialWorkerNames = users
      .filter((u) => initialSelectedWorkers.includes(u.id) && (initialWorkerHours[u.id] || 0) > 0)
      .map((u) => `${u.display_name}: ${initialWorkerHours[u.id]}h`)
      .join(", ");

    const initialTotalHours = Object.values(initialWorkerHours).reduce(
      (sum, hours) => sum + hours,
      0
    );

    return [
      { fieldName: "顧客名", value: initialCustomerName },
      { fieldName: "現場名", value: initialSiteName },
      {
        fieldName: "作業概要",
        value:
          initialSummary.length > 50 ? `${initialSummary.substring(0, 50)}...` : initialSummary,
      },
      { fieldName: "作業者・工数", value: initialWorkerNames || "（未設定）" },
      { fieldName: "合計工数", value: `${initialTotalHours}h` },
    ];
  };

  const getNewUpdateData = (): DataRecord[] => {
    const workersWithHours = users
      .filter((u) => selectedWorkers.includes(u.id) && (workerHours[u.id] || 0) > 0)
      .map((u) => `${u.display_name}: ${workerHours[u.id]}h`)
      .join(", ");

    return [
      { fieldName: "顧客名", value: customerName },
      { fieldName: "現場名", value: siteName },
      {
        fieldName: "作業概要",
        value: summary.length > 50 ? `${summary.substring(0, 50)}...` : summary,
      },
      { fieldName: "作業者・工数", value: workersWithHours || "（未設定）" },
      { fieldName: "合計工数", value: `${calculateTotalHours()}h` },
    ];
  };

  if (isLoading) {
    return (
      <div className="p-4 max-w-4xl mx-auto">
        <div className="text-center py-12">
          <p className="text-gray-500">読み込み中...</p>
        </div>
      </div>
    );
  }

  if (!dailyReportData?.daily_report) {
    return (
      <div className="p-4 max-w-4xl mx-auto">
        <div className="text-center py-12">
          <p className="text-red-500">日報が見つかりません</p>
          <button
            onClick={() => navigate("/list")}
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
          >
            一覧に戻る
          </button>
        </div>
      </div>
    );
  }

  const report = dailyReportData.daily_report;

  return (
    <div className="p-4 max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold mb-4">日報の編集</h2>
      <p className="text-sm text-gray-600 mb-6">
        作業日: {format(new Date(report.work_date), "yyyy年M月d日(E)", { locale: ja })}
      </p>

      <div className="bg-white rounded-lg shadow-sm p-6 space-y-6">
        {/* 顧客・現場 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            顧客・現場
            <span className="text-red-500 ml-1">*</span>
          </label>
          <CustomerSiteSelector
            customerId={customerId}
            siteId={siteId}
            customerName={customerName}
            siteName={siteName}
            onSelect={handleCustomerSiteSelect}
            showRecentCustomers={false}
          />
        </div>

        {/* 作業概要 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            作業概要
            <span className="text-red-500 ml-1">*</span>
          </label>
          <textarea
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            placeholder="例: エアコン設置工事、配線作業"
            maxLength={200}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          <p className="text-xs text-gray-500 mt-1">{summary.length}/200文字</p>
        </div>

        {/* 作業者・工数 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            作業者
            <span className="text-red-500 ml-1">*</span>
          </label>
          {!showWorkerSelect ? (
            <div className="flex items-center gap-2">
              <div className="flex-1 px-3 py-2 border border-gray-300 rounded-lg bg-gray-50">
                <p className="text-sm">{selectedWorkerNames || "（未選択）"}</p>
              </div>
              <button
                onClick={() => setShowWorkerSelect(true)}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                変更
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              <WorkerSelect
                selectedWorkers={selectedWorkers}
                onWorkersChange={handleWorkersChange}
              />
              <button
                onClick={() => setShowWorkerSelect(false)}
                className="text-sm text-gray-600 hover:text-gray-800"
              >
                キャンセル
              </button>
            </div>
          )}
        </div>

        {/* 作業時間入力 */}
        {selectedWorkers.length > 0 && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              作業時間（0.25h単位）
              <span className="text-red-500 ml-1">*</span>
            </label>
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {users
                  .filter((u) => selectedWorkers.includes(u.id))
                  .map((u) => (
                    <div
                      key={u.id}
                      className="flex items-center justify-between bg-white rounded-lg px-4 py-3 border border-gray-200"
                    >
                      <span className="font-medium text-gray-700">{u.display_name}</span>
                      <TimeInput
                        value={workerHours[u.id] || 0}
                        onChange={(value) => updateWorkerHours(u.id, value)}
                      />
                    </div>
                  ))}
              </div>
              <div className="mt-4 flex justify-end">
                <div className="bg-blue-50 px-4 py-2 rounded-lg">
                  <span className="text-sm text-gray-600">合計: </span>
                  <span className="text-lg font-bold text-blue-600">{calculateTotalHours()}h</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ボタン */}
        <div className="flex justify-between pt-4">
          <button
            onClick={() => setShowDeleteModal(true)}
            className="px-6 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
          >
            削除
          </button>
          <div className="flex gap-3">
            <button
              onClick={() => navigate("/list")}
              className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              キャンセル
            </button>
            <button
              onClick={() => setShowUpdateModal(true)}
              disabled={!isFormValid || bulkUpdate.isPending}
              className={`px-6 py-2 rounded-lg font-medium text-white ${
                !isFormValid || bulkUpdate.isPending
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-blue-500 hover:bg-blue-600"
              }`}
            >
              {bulkUpdate.isPending ? "更新中..." : "更新"}
            </button>
          </div>
        </div>
      </div>

      {/* 更新確認モーダル */}
      <UpdateConfirmModal
        isOpen={showUpdateModal}
        onClose={() => setShowUpdateModal(false)}
        onConfirm={handleUpdate}
        title="日報の更新"
        description="以下の内容で日報を更新します。よろしいですか？"
        newDatas={getNewUpdateData()}
        oldDatas={getOldUpdateData()}
        confirmText="更新する"
        isSubmitting={bulkUpdate.isPending}
      />

      {/* 削除確認モーダル */}
      <ConfirmModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDelete}
        title="日報の削除"
        message="この日報を削除してもよろしいですか？"
        confirmText="削除する"
        variant="danger"
      />
    </div>
  );
}
