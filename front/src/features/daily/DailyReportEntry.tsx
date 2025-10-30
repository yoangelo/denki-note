import { SelectCustomerAndSite } from "@/components/SelectCustomerAndSite";
import { TimeInput } from "@/components/TimeInput";
import { WorkerSelect } from "@/components/WorkerSelect";
import { useListUsers } from "@/api/generated/users/users";

// 作業内容の入力行
export type WorkRow = {
  id: string;
  customerId: string;
  siteId: string;
  summary: string;
  selectedWorkers: string[];
  workerHours: Record<string, number>;
};

type DailyReportEntryProps = {
  workDate: string;
  showWorkArea: boolean;
  workRows: WorkRow[];
  onStartReport: () => void;
  addRow: () => void;
  deleteRow: (rowId: string) => void;
  updateRow: (rowId: string, updates: Partial<WorkRow>) => void;
  handleCustomerSiteSelect: (rowId: string, ids: { customerId: string; siteId: string }) => void;
  handleWorkersChange: (rowId: string, workers: string[]) => void;
  updateWorkerHours: (rowId: string, workerId: string, hours: number) => void;
  calculateRowTotal: (row: WorkRow) => number;
  calculateTotalHours: () => number;
  handleSave: () => void;
  isRowValid: (row: WorkRow) => boolean;
  bulkCreateIsPending: boolean;
};

export function DailyReportEntry({
  workDate,
  showWorkArea,
  workRows,
  onStartReport,
  addRow,
  deleteRow,
  updateRow,
  handleCustomerSiteSelect,
  handleWorkersChange,
  updateWorkerHours,
  calculateRowTotal,
  calculateTotalHours,
  handleSave,
  isRowValid,
  bulkCreateIsPending,
}: DailyReportEntryProps) {
  const { data: users = [] } = useListUsers({ is_active: true });

  return (
    <>
      {/* 作業内容入力エリア or 日報作成ボタン */}
      {!showWorkArea ? (
        <div className="bg-white rounded-lg shadow-sm p-12 text-center">
          <svg
            className="mx-auto h-12 w-12 text-gray-400 mb-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          <h3 className="text-lg font-medium text-gray-900 mb-2">{workDate}の日報</h3>
          <p className="text-sm text-gray-500 mb-6">
            作業内容を入力するには「日報を作成する」をクリックしてください
          </p>
          <button
            onClick={onStartReport}
            className="px-6 py-3 bg-blue-500 text-white font-medium rounded-lg hover:bg-blue-600 transition-colors shadow-lg hover:shadow-xl"
          >
            日報を作成する
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {workRows.map((row, index) => (
            <div
              key={row.id}
              className={`bg-white rounded-lg shadow-sm overflow-hidden transition-all ${
                isRowValid(row) ? "ring-2 ring-green-500" : ""
              }`}
            >
              {/* 行ヘッダー */}
              <div className="bg-gray-50 px-4 py-3 border-b flex justify-between items-center">
                <h3 className="font-medium text-gray-700">
                  作業 {index + 1}
                  {isRowValid(row) && <span className="ml-2 text-green-600">✓</span>}
                </h3>
                {workRows.length > 1 && (
                  <button
                    onClick={() => deleteRow(row.id)}
                    className="text-red-500 hover:text-red-700 text-sm font-medium"
                  >
                    削除
                  </button>
                )}
              </div>

              <div className="p-4 space-y-4">
                {/* 顧客・現場選択 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    顧客・現場
                    <span className="text-red-500 ml-1">*</span>
                  </label>
                  <SelectCustomerAndSite
                    onSelect={(ids) => handleCustomerSiteSelect(row.id, ids)}
                  />
                </div>

                {/* 概要入力 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">作業概要</label>
                  <textarea
                    value={row.summary}
                    onChange={(e) => updateRow(row.id, { summary: e.target.value })}
                    placeholder="例: エアコン設置工事、配線作業"
                    maxLength={200}
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">{row.summary.length}/200文字</p>
                </div>

                {/* 作業者選択 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    作業者
                    <span className="text-red-500 ml-1">*</span>
                  </label>
                  <WorkerSelect
                    selectedWorkers={row.selectedWorkers}
                    onWorkersChange={(workers) => handleWorkersChange(row.id, workers)}
                  />
                </div>

                {/* 作業時間入力 */}
                {row.selectedWorkers.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      作業時間（0.25h単位）
                      <span className="text-red-500 ml-1">*</span>
                    </label>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {users
                          .filter((user) => row.selectedWorkers.includes(user.id))
                          .map((user) => (
                            <div
                              key={user.id}
                              className="flex items-center justify-between bg-white rounded-lg px-4 py-3 border border-gray-200"
                            >
                              <span className="font-medium text-gray-700">{user.display_name}</span>
                              <TimeInput
                                value={row.workerHours[user.id] || 0}
                                onChange={(value) => updateWorkerHours(row.id, user.id, value)}
                              />
                            </div>
                          ))}
                      </div>
                      <div className="mt-4 flex justify-end">
                        <div className="bg-blue-50 px-4 py-2 rounded-lg">
                          <span className="text-sm text-gray-600">合計: </span>
                          <span className="text-lg font-bold text-blue-600">
                            {calculateRowTotal(row)}h
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 日報追加ボタン（作業エリア表示中のみ） */}
      {showWorkArea && (
        <div className="mt-4">
          <button
            onClick={addRow}
            className="w-full py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-blue-400 hover:text-blue-600 transition-colors"
          >
            + 日報を追加
          </button>
        </div>
      )}

      {/* フッター（合計と保存ボタン）（作業エリア表示中のみ） */}
      {showWorkArea && (
        <div className="mt-6 bg-white rounded-lg shadow-sm p-6">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-6">
              <div>
                <span className="text-sm text-gray-600">作業件数</span>
                <p className="text-2xl font-bold text-gray-900">
                  {workRows.filter(isRowValid).length}件
                </p>
              </div>
              <div>
                <span className="text-sm text-gray-600">総工数</span>
                <p className="text-2xl font-bold text-blue-600">{calculateTotalHours()}h</p>
              </div>
            </div>
            <button
              onClick={handleSave}
              disabled={bulkCreateIsPending || !workRows.some(isRowValid)}
              className={`px-8 py-3 rounded-lg font-medium text-white transition-all ${
                bulkCreateIsPending || !workRows.some(isRowValid)
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-blue-500 hover:bg-blue-600 shadow-lg hover:shadow-xl"
              }`}
            >
              {bulkCreateIsPending ? (
                <span className="flex items-center">
                  <svg
                    className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                    />
                  </svg>
                  保存中...
                </span>
              ) : (
                "保存"
              )}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
