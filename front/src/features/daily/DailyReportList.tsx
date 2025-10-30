import React, { useMemo } from "react";
import { format } from "date-fns";
import { ja } from "date-fns/locale";

type Worker = {
  id: string;
  name: string;
  display_name?: string;
};

type WorkRow = {
  id: string;
  customerName: string;
  siteName: string;
  summary: string;
  workerHours: Record<string, number>;
};

type DailyReportListProps = {
  workDate: Date;
  workRows: WorkRow[];
  workers: Worker[];
  onDeleteRow: (id: string) => void;
};

export const DailyReportList: React.FC<DailyReportListProps> = ({
  workDate,
  workRows,
  workers,
  onDeleteRow,
}) => {
  // 作業データに含まれる作業者のみを抽出
  const activeWorkers = useMemo(() => {
    const workerIds = new Set<string>();
    workRows.forEach((row) => {
      Object.keys(row.workerHours).forEach((workerId) => {
        if (row.workerHours[workerId] > 0) {
          workerIds.add(workerId);
        }
      });
    });
    return workers.filter((worker) => workerIds.has(worker.id));
  }, [workRows, workers]);

  const calculateRowTotal = (workerHours: Record<string, number>): number => {
    return Object.values(workerHours).reduce((sum, hours) => sum + hours, 0);
  };

  const calculateDayTotal = (): number => {
    return workRows.reduce((sum, row) => sum + calculateRowTotal(row.workerHours), 0);
  };

  return (
    <div>
      <h3 className="text-lg font-bold mb-3">
        {format(workDate, "yyyy年M月d日", { locale: ja })}の作業
      </h3>

      <div className="mb-6 overflow-x-auto">
        <table className="w-full border-collapse bg-white rounded-lg overflow-hidden shadow-sm">
          <thead>
            <tr className="bg-gray-100">
              <th className="border border-gray-300 px-2 py-2 text-left text-sm">お客様名</th>
              <th className="border border-gray-300 px-2 py-2 text-left text-sm">現場名</th>
              <th className="border border-gray-300 px-2 py-2 text-left text-sm">概要</th>
              {activeWorkers.map((worker) => (
                <th
                  key={worker.id}
                  className="border border-gray-300 px-2 py-2 text-center text-sm min-w-[80px]"
                >
                  {worker.display_name || worker.name}
                </th>
              ))}
              <th className="border border-gray-300 px-2 py-2 text-center text-sm">合計</th>
              <th className="border border-gray-300 px-2 py-2 text-center text-sm">操作</th>
            </tr>
          </thead>
          <tbody>
            {workRows.map((row) => (
              <tr key={row.id}>
                <td className="border border-gray-300 px-2 py-1 text-sm">{row.customerName}</td>
                <td className="border border-gray-300 px-2 py-1 text-sm">{row.siteName}</td>
                <td className="border border-gray-300 px-2 py-1 text-sm">{row.summary}</td>
                {activeWorkers.map((worker) => (
                  <td
                    key={worker.id}
                    className="border border-gray-300 px-2 py-1 text-center text-sm"
                  >
                    {row.workerHours[worker.id] || "-"}
                  </td>
                ))}
                <td className="border border-gray-300 px-2 py-1 text-center text-sm font-semibold">
                  {calculateRowTotal(row.workerHours)}
                </td>
                <td className="border border-gray-300 px-2 py-1 text-center">
                  <button
                    onClick={() => onDeleteRow(row.id)}
                    className="text-red-500 hover:text-red-700 text-xs"
                  >
                    削除
                  </button>
                </td>
              </tr>
            ))}
            {workRows.length === 0 && (
              <tr>
                <td
                  colSpan={activeWorkers.length + 5}
                  className="border border-gray-300 px-4 py-8 text-center text-gray-500"
                >
                  作業データがありません
                </td>
              </tr>
            )}
            {workRows.length > 0 && (
              <tr className="bg-gray-50 font-semibold">
                <td colSpan={3} className="border border-gray-300 px-2 py-2 text-right">
                  日計
                </td>
                {activeWorkers.map((worker) => {
                  const workerTotal = workRows.reduce(
                    (sum, row) => sum + (row.workerHours[worker.id] || 0),
                    0
                  );
                  return (
                    <td key={worker.id} className="border border-gray-300 px-2 py-2 text-center">
                      {workerTotal || "-"}
                    </td>
                  );
                })}
                <td className="border border-gray-300 px-2 py-2 text-center">
                  {calculateDayTotal()}
                </td>
                <td className="border border-gray-300 px-2 py-2"></td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
