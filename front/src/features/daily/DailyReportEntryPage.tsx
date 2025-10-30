import { useState, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { DailyReportEntry, type WorkRow } from "./DailyReportEntry";
import { Toast } from "@/components/Toast";
import { useToast } from "@/hooks/useToast";
import { useBulkCreateWorkEntries } from "@/api/generated/work-entries/work-entries";

export function DailyReportEntryPage() {
  const [workDate, setWorkDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split("T")[0];
  });

  const [showWorkArea, setShowWorkArea] = useState(false);
  const [workRows, setWorkRows] = useState<WorkRow[]>([]);

  const { toasts, showToast, removeToast } = useToast();
  const queryClient = useQueryClient();

  const bulkCreate = useBulkCreateWorkEntries({
    mutation: {
      onSuccess: (data) => {
        showToast(`${data.accepted}件の作業を保存しました`, "success");
        // 保存成功後、フォームをクリアして作業エリアを閉じる
        setWorkRows([]);
        setShowWorkArea(false);
        queryClient.invalidateQueries({ queryKey: ["/summaries/customer-month"] });
      },
      onError: () => {
        showToast("保存に失敗しました", "error");
      },
    },
  });

  // 今日の日付かチェック
  const isToday = (dateString: string) => {
    const today = new Date().toISOString().split("T")[0];
    return dateString === today;
  };

  // 行を追加
  const addRow = useCallback(() => {
    setWorkRows((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        customerId: "",
        siteId: "",
        summary: "",
        selectedWorkers: [],
        workerHours: {},
      },
    ]);
  }, []);

  // 行を削除
  const deleteRow = useCallback(
    (rowId: string) => {
      setWorkRows((prev) => {
        if (prev.length === 1) {
          showToast("最低1行は必要です", "error");
          return prev;
        }
        return prev.filter((row) => row.id !== rowId);
      });
    },
    [showToast]
  );

  // 行を更新
  const updateRow = useCallback((rowId: string, updates: Partial<WorkRow>) => {
    setWorkRows((prev) => prev.map((row) => (row.id === rowId ? { ...row, ...updates } : row)));
  }, []);

  // 顧客・現場選択ハンドラ
  const handleCustomerSiteSelect = useCallback(
    (rowId: string, ids: { customerId: string; siteId: string }) => {
      updateRow(rowId, { customerId: ids.customerId, siteId: ids.siteId });
    },
    [updateRow]
  );

  // 作業者選択更新
  const handleWorkersChange = useCallback((rowId: string, workers: string[]) => {
    setWorkRows((prev) =>
      prev.map((row) => {
        if (row.id !== rowId) return row;
        // 選択解除された作業者の時間をクリア
        const newHours = { ...row.workerHours };
        Object.keys(newHours).forEach((workerId) => {
          if (!workers.includes(workerId)) {
            delete newHours[workerId];
          }
        });
        return { ...row, selectedWorkers: workers, workerHours: newHours };
      })
    );
  }, []);

  // 時間入力更新
  const updateWorkerHours = useCallback((rowId: string, workerId: string, hours: number) => {
    setWorkRows((prev) =>
      prev.map((row) => {
        if (row.id !== rowId) return row;
        return {
          ...row,
          workerHours: { ...row.workerHours, [workerId]: hours },
        };
      })
    );
  }, []);

  // 行の合計時間を計算
  const calculateRowTotal = useCallback((row: WorkRow) => {
    return Object.values(row.workerHours).reduce((sum, h) => sum + h, 0);
  }, []);

  // 全体の合計時間を計算
  const calculateTotalHours = useCallback(() => {
    return workRows.reduce((sum, row) => sum + calculateRowTotal(row), 0);
  }, [workRows, calculateRowTotal]);

  // 保存処理
  const handleSave = useCallback(() => {
    // バリデーション
    const validRows = workRows.filter(
      (row) =>
        row.customerId && row.siteId && row.selectedWorkers.length > 0 && calculateRowTotal(row) > 0
    );

    if (validRows.length === 0) {
      showToast("保存可能な作業がありません", "error");
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

    validRows.forEach((row) => {
      Object.entries(row.workerHours).forEach(([workerId, hours]) => {
        if (hours > 0) {
          entries.push({
            client_entry_id: `${Date.now()}_${workerId}_${row.id}`,
            daily_report_id: `report_${workDate}_${row.siteId}`,
            user_id: workerId,
            summary: row.summary,
            minutes: Math.round(hours * 60),
          });
        }
      });
    });

    const clientBatchId = `batch_${Date.now()}`;
    bulkCreate.mutate({
      data: {
        client_batch_id: clientBatchId,
        entries,
      },
    });
  }, [workRows, workDate, calculateRowTotal, bulkCreate, showToast]);

  // 行が有効かチェック
  const isRowValid = useCallback(
    (row: WorkRow) => {
      return !!(
        row.customerId &&
        row.siteId &&
        row.selectedWorkers.length > 0 &&
        calculateRowTotal(row) > 0
      );
    },
    [calculateRowTotal]
  );

  // 日報作成開始
  const handleStartReport = useCallback(() => {
    setShowWorkArea(true);
    setWorkRows([
      {
        id: crypto.randomUUID(),
        customerId: "",
        siteId: "",
        summary: "",
        selectedWorkers: [],
        workerHours: {},
      },
    ]);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* ヘッダー */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <h1 className="text-2xl font-bold text-gray-900">日報入力</h1>
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={workDate}
                onChange={(e) => setWorkDate(e.target.value)}
                className={`px-4 py-2 border rounded-lg font-medium ${
                  isToday(workDate) ? "border-blue-500 bg-blue-50" : "border-gray-300"
                }`}
              />
            </div>
          </div>
        </div>

        <DailyReportEntry
          workDate={workDate}
          showWorkArea={showWorkArea}
          workRows={workRows}
          onStartReport={handleStartReport}
          addRow={addRow}
          deleteRow={deleteRow}
          updateRow={updateRow}
          handleCustomerSiteSelect={handleCustomerSiteSelect}
          handleWorkersChange={handleWorkersChange}
          updateWorkerHours={updateWorkerHours}
          calculateRowTotal={calculateRowTotal}
          calculateTotalHours={calculateTotalHours}
          handleSave={handleSave}
          isRowValid={isRowValid}
          bulkCreateIsPending={bulkCreate.isPending}
        />

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
    </div>
  );
}
