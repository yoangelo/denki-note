import { useState, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import {
  DailyReportEntry,
  type WorkRow,
  type SelectedProduct,
  type SelectedMaterial,
} from "./DailyReportEntry";
import { useBulkCreateDailyReports } from "@/api/generated/daily-reports/daily-reports";
import { ConfirmModal } from "@/components/ui";

export function DailyReportEntryPage() {
  const [workDate, setWorkDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split("T")[0];
  });

  const [showWorkArea, setShowWorkArea] = useState(false);
  const [workRows, setWorkRows] = useState<WorkRow[]>([]);
  const [showSaveConfirmModal, setShowSaveConfirmModal] = useState(false);

  const queryClient = useQueryClient();

  const bulkCreate = useBulkCreateDailyReports({
    mutation: {
      onSuccess: (data) => {
        toast.success(`${data.summary?.entries_created}件の作業を保存しました`);
        // 保存成功後、フォームをクリアして作業エリアを閉じる
        setWorkRows([]);
        setShowWorkArea(false);
        queryClient.invalidateQueries({ queryKey: ["/summaries/customer-month"] });
      },
      onError: () => {
        toast.error("保存に失敗しました");
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
        products: [],
        materials: [],
      },
    ]);
  }, []);

  // 行を削除
  const deleteRow = useCallback((rowId: string) => {
    setWorkRows((prev) => {
      if (prev.length === 1) {
        toast.error("最低1行は必要です");
        return prev;
      }
      return prev.filter((row) => row.id !== rowId);
    });
  }, []);

  // 行を更新
  const updateRow = useCallback((rowId: string, updates: Partial<WorkRow>) => {
    setWorkRows((prev) => prev.map((row) => (row.id === rowId ? { ...row, ...updates } : row)));
  }, []);

  // 顧客・現場選択ハンドラ
  const handleCustomerSiteSelect = useCallback(
    (
      rowId: string,
      data: {
        customerId: string;
        siteId: string;
        customerName?: string;
        siteName?: string;
        customerType?: "corporate" | "individual";
      }
    ) => {
      updateRow(rowId, { customerId: data.customerId, siteId: data.siteId });
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

  // 製品選択更新
  const handleProductsChange = useCallback((rowId: string, products: SelectedProduct[]) => {
    setWorkRows((prev) => prev.map((row) => (row.id === rowId ? { ...row, products } : row)));
  }, []);

  // 資材選択更新
  const handleMaterialsChange = useCallback((rowId: string, materials: SelectedMaterial[]) => {
    setWorkRows((prev) => prev.map((row) => (row.id === rowId ? { ...row, materials } : row)));
  }, []);

  // 行の合計時間を計算
  const calculateRowTotal = useCallback((row: WorkRow) => {
    return Object.values(row.workerHours).reduce((sum, h) => sum + h, 0);
  }, []);

  // 全体の合計時間を計算
  const calculateTotalHours = useCallback(() => {
    return workRows.reduce((sum, row) => sum + calculateRowTotal(row), 0);
  }, [workRows, calculateRowTotal]);

  // 保存処理（確認モーダルを表示）
  const handleSave = useCallback(() => {
    // バリデーション
    const validRows = workRows.filter(
      (row) =>
        row.customerId && row.siteId && row.selectedWorkers.length > 0 && calculateRowTotal(row) > 0
    );

    if (validRows.length === 0) {
      toast.error("保存可能な作業がありません");
      return;
    }

    setShowSaveConfirmModal(true);
  }, [workRows, calculateRowTotal]);

  // 保存確定処理
  const handleConfirmSave = useCallback(() => {
    const validRows = workRows.filter(
      (row) =>
        row.customerId && row.siteId && row.selectedWorkers.length > 0 && calculateRowTotal(row) > 0
    );

    // 現場ごとに日報をグループ化
    const reportsBySite = new Map<string, WorkRow[]>();
    validRows.forEach((row) => {
      const key = `${row.siteId}_${row.summary}`;
      if (!reportsBySite.has(key)) {
        reportsBySite.set(key, []);
      }
      reportsBySite.get(key)!.push(row);
    });

    // APIに送信するデータを作成（tenant_idとcreated_byはサーバー側で自動設定）
    const daily_reports: Array<{
      site_id: string;
      work_date: string;
      summary: string;
      work_entries: Array<{
        user_id: string;
        minutes: number;
      }>;
      products?: Array<{
        product_id: string;
        quantity: number;
      }>;
      materials?: Array<{
        material_id: string;
        quantity: number;
      }>;
    }> = [];

    reportsBySite.forEach((rows, key) => {
      const [siteId, summary] = key.split("_");
      const work_entries: Array<{ user_id: string; minutes: number }> = [];
      const products: Array<{ product_id: string; quantity: number }> = [];
      const materials: Array<{ material_id: string; quantity: number }> = [];

      rows.forEach((row) => {
        Object.entries(row.workerHours).forEach(([workerId, hours]) => {
          if (hours > 0) {
            work_entries.push({
              user_id: workerId,
              minutes: Math.round(hours * 60),
            });
          }
        });

        // 製品を追加
        row.products.forEach((product) => {
          if (product.quantity > 0) {
            products.push({
              product_id: product.product_id,
              quantity: product.quantity,
            });
          }
        });

        // 資材を追加
        row.materials.forEach((material) => {
          if (material.quantity > 0) {
            materials.push({
              material_id: material.material_id,
              quantity: material.quantity,
            });
          }
        });
      });

      if (work_entries.length > 0) {
        daily_reports.push({
          site_id: siteId,
          work_date: workDate,
          summary: summary || "作業実施",
          work_entries,
          products: products.length > 0 ? products : undefined,
          materials: materials.length > 0 ? materials : undefined,
        });
      }
    });

    bulkCreate.mutate({
      data: {
        daily_reports: daily_reports as never,
      },
    });
    setShowSaveConfirmModal(false);
  }, [workRows, workDate, calculateRowTotal, bulkCreate]);

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
        products: [],
        materials: [],
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
          handleProductsChange={handleProductsChange}
          handleMaterialsChange={handleMaterialsChange}
          calculateRowTotal={calculateRowTotal}
          calculateTotalHours={calculateTotalHours}
          handleSave={handleSave}
          isRowValid={isRowValid}
          bulkCreateIsPending={bulkCreate.isPending}
        />
      </div>

      {/* Save Confirmation Modal */}
      <ConfirmModal
        isOpen={showSaveConfirmModal}
        onClose={() => setShowSaveConfirmModal(false)}
        onConfirm={handleConfirmSave}
        title="日報の保存確認"
        message={`日報を保存しますか？\n\n作業日: ${workDate}\n作業件数: ${workRows.filter(isRowValid).length}件\n合計時間: ${calculateTotalHours()}時間`}
        confirmText="保存する"
        loading={bulkCreate.isPending}
      />
    </div>
  );
}
