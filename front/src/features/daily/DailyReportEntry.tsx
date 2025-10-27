import { useState, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { SelectCustomerAndSite } from "./SelectCustomerAndSite";
import { TimeInput } from "@/components/TimeInput";
import { Toast } from "@/components/Toast";
import { useToast } from "@/hooks/useToast";
import { mockWorkers } from "@/data/mockWorkers";
import { useBulkCreateWorkEntries } from "@/api/generated/work-entries/work-entries";

export function DailyReportEntry() {
  const [workDate, setWorkDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split("T")[0];
  });

  const [customerId, setCustomerId] = useState<string>("");
  const [siteId, setSiteId] = useState<string>("");
  const [summary, setSummary] = useState<string>("");
  const [workerHours, setWorkerHours] = useState<Record<string, number>>({});

  const { toasts, showToast, removeToast } = useToast();
  const queryClient = useQueryClient();

  const bulkCreate = useBulkCreateWorkEntries({
    mutation: {
      onSuccess: (data) => {
        showToast(`${data.accepted}件の作業を保存しました`, "success");
        // 保存成功後、フォームをクリア
        setCustomerId("");
        setSiteId("");
        setSummary("");
        setWorkerHours({});
        queryClient.invalidateQueries({ queryKey: ["/summaries/customer-month"] });
      },
      onError: () => {
        showToast("保存に失敗しました", "error");
      },
    },
  });

  // 顧客・現場選択ハンドラ
  const handleCustomerSiteSelect = useCallback((ids: { customerId: string; siteId: string }) => {
    setCustomerId(ids.customerId);
    setSiteId(ids.siteId);
  }, []);

  // 時間入力更新
  const updateWorkerHours = useCallback((workerId: string, hours: number) => {
    setWorkerHours((prev) => ({
      ...prev,
      [workerId]: hours,
    }));
  }, []);

  // 合計時間を計算
  const calculateTotal = useCallback(() => {
    return Object.values(workerHours).reduce((sum, h) => sum + h, 0);
  }, [workerHours]);

  // 保存処理
  const handleSave = useCallback(() => {
    if (!customerId || !siteId) {
      showToast("顧客と現場を選択してください", "error");
      return;
    }

    const totalHours = calculateTotal();
    if (totalHours === 0) {
      showToast("作業時間を入力してください", "error");
      return;
    }

    // APIに送信するデータを作成
    const entries: {
      client_entry_id: string;
      daily_report_id: string;
      user_id: string;
      summary: string;
      minutes: number;
    }[] = [];
    Object.entries(workerHours).forEach(([workerId, hours]) => {
      if (hours > 0) {
        entries.push({
          client_entry_id: `${Date.now()}_${workerId}`,
          daily_report_id: `report_${workDate}_${siteId}`,
          user_id: workerId,
          summary: summary,
          minutes: Math.round(hours * 60),
        });
      }
    });

    const clientBatchId = `batch_${Date.now()}`;
    bulkCreate.mutate({
      data: {
        client_batch_id: clientBatchId,
        entries,
      },
    });
  }, [customerId, siteId, workerHours, summary, workDate, calculateTotal, bulkCreate, showToast]);

  return (
    <div className="p-4 max-w-full">
      <h2 className="text-2xl font-bold mb-4">日報入力</h2>

      {/* 日付選択 */}
      <div className="mb-4">
        <label className="block text-sm font-medium mb-1">作業日</label>
        <input
          type="date"
          value={workDate}
          onChange={(e) => setWorkDate(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-md"
        />
      </div>

      {/* 入力フォーム */}
      <div className="bg-white p-4 rounded-lg shadow-md mb-4">
        <h3 className="text-lg font-semibold mb-3">作業内容</h3>

        {/* 顧客・現場選択 */}
        <div className="mb-4">
          <SelectCustomerAndSite onSelect={handleCustomerSiteSelect} />
        </div>

        {/* 概要入力 */}
        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">概要（任意）</label>
          <input
            type="text"
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            placeholder="作業内容を入力（最大200文字）"
            maxLength={200}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
          />
        </div>

        {/* 作業者時間入力 */}
        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">作業時間（0.25h単位）</label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {mockWorkers.map((worker) => (
              <div key={worker.id} className="flex items-center justify-between">
                <span className="text-sm font-medium mr-2">{worker.name}:</span>
                <TimeInput
                  value={workerHours[worker.id] || 0}
                  onChange={(value) => updateWorkerHours(worker.id, value)}
                />
              </div>
            ))}
          </div>
          <div className="mt-2 text-right">
            <span className="text-sm font-semibold">合計: {calculateTotal()}h</span>
          </div>
        </div>

        {/* 保存ボタン */}
        <div className="flex justify-end gap-2">
          <button
            onClick={handleSave}
            disabled={bulkCreate.isPending}
            className={`px-6 py-2 text-white rounded ${
              bulkCreate.isPending
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-blue-500 hover:bg-blue-600"
            }`}
          >
            {bulkCreate.isPending ? "保存中..." : "保存"}
          </button>
        </div>
      </div>

      {/* トースト表示 */}
      <div className="fixed top-0 right-0 z-50">
        {toasts.map((toast) => (
          <Toast
            key={toast.id}
            message={toast.message}
            type={toast.type}
            onClose={() => removeToast(toast.id)}
          />
        ))}
      </div>
    </div>
  );
}
