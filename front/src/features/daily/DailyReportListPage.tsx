import { useState, useMemo } from "react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval } from "date-fns";
import { DailyReportList } from "./DailyReportList";
import { useListUsers } from "@/api/generated/users/users";

// モックデータ型
type WorkRow = {
  id: string;
  customerName: string;
  siteName: string;
  summary: string;
  workerHours: Record<string, number>;
};

// モックデータ生成
const generateMockData = (
  workers: Array<{ id: string; display_name: string }>
): Record<string, WorkRow[]> => {
  const data: Record<string, WorkRow[]> = {};
  const customers = ["㈱ABC建設", "㈱DEF組", "GHI様", "JKL㈱"];
  const sites = ["〇〇市役所", "△△倉庫", "GHI様宅", "□□プール"];
  const summaries = [
    "エアコン外気復旧",
    "電源盤取付、入線",
    "エアコン取付工事",
    "盤組立",
    "仕上げ、後片付",
  ];

  // 現在の月の日付リストを生成
  const now = new Date();
  const monthDays = eachDayOfInterval({
    start: startOfMonth(now),
    end: endOfMonth(now),
  });

  // ランダムに数日分のデータを生成
  const sampleDays = monthDays.slice(0, 5);

  sampleDays.forEach((date) => {
    const dateKey = format(date, "yyyy-MM-dd");
    const rowCount = Math.floor(Math.random() * 3) + 1;
    const rows: WorkRow[] = [];

    for (let i = 0; i < rowCount; i++) {
      const workerHours: Record<string, number> = {};
      // ランダムに作業者を選択
      const selectedWorkerCount = Math.floor(Math.random() * Math.min(3, workers.length)) + 1;
      const shuffled = [...workers].sort(() => 0.5 - Math.random());
      const selectedWorkers = shuffled.slice(0, selectedWorkerCount);

      selectedWorkers.forEach((worker) => {
        workerHours[worker.id] = Math.floor(Math.random() * 4 + 1) * 0.5;
      });

      rows.push({
        id: `${dateKey}-${i}`,
        customerName: customers[Math.floor(Math.random() * customers.length)],
        siteName: sites[Math.floor(Math.random() * sites.length)],
        summary: summaries[Math.floor(Math.random() * summaries.length)],
        workerHours,
      });
    }

    data[dateKey] = rows;
  });

  return data;
};

export function DailyReportListPage() {
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return format(now, "yyyy-MM");
  });

  // APIから作業者一覧を取得
  const { data: users = [] } = useListUsers({ is_active: true });

  // モックデータ
  const allData = useMemo(() => {
    if (users.length === 0) return {};
    return generateMockData(users);
  }, [users]);

  // 選択月の日付リストを生成
  const monthDays = useMemo(() => {
    const [year, month] = selectedMonth.split("-").map(Number);
    const monthStart = new Date(year, month - 1, 1);
    return eachDayOfInterval({
      start: startOfMonth(monthStart),
      end: endOfMonth(monthStart),
    });
  }, [selectedMonth]);

  // 選択月のデータをフィルタリング
  const monthData = useMemo(() => {
    const filtered: Record<string, WorkRow[]> = {};
    monthDays.forEach((date) => {
      const dateKey = format(date, "yyyy-MM-dd");
      if (allData[dateKey]) {
        filtered[dateKey] = allData[dateKey];
      }
    });
    return filtered;
  }, [monthDays, allData]);

  const handleDeleteRow = (dateKey: string, rowId: string) => {
    console.log(`削除: ${dateKey} - ${rowId}`);
    // 実際のアプリケーションではここでAPIを呼び出して削除
  };

  // Worker型に変換（display_nameとnameを統一）
  const workersForList = useMemo(() => {
    return users.map((user) => ({
      id: user.id,
      name: user.display_name,
      display_name: user.display_name,
    }));
  }, [users]);

  return (
    <div className="p-4 max-w-full">
      <h2 className="text-2xl font-bold mb-4">日報一覧</h2>

      {/* 月選択 */}
      <div className="mb-6">
        <label className="block text-sm font-medium mb-1">表示月</label>
        <input
          type="month"
          value={selectedMonth}
          onChange={(e) => setSelectedMonth(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-md"
        />
      </div>

      {/* 日報一覧 */}
      {Object.keys(monthData).length > 0 ? (
        <div className="space-y-6">
          {Object.entries(monthData)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([dateKey, rows]) => {
              const date = new Date(dateKey);
              return (
                <DailyReportList
                  key={dateKey}
                  workDate={date}
                  workRows={rows}
                  workers={workersForList}
                  onDeleteRow={(id) => handleDeleteRow(dateKey, id)}
                />
              );
            })}
        </div>
      ) : (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <p className="text-gray-500">選択された月の日報データはありません</p>
        </div>
      )}

      {/* 統計情報 */}
      <div className="mt-8 p-4 bg-blue-50 rounded-lg">
        <h3 className="text-lg font-semibold mb-2">月次サマリー</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <p className="text-sm text-gray-600">作業日数</p>
            <p className="text-2xl font-bold">{Object.keys(monthData).length}日</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">総作業件数</p>
            <p className="text-2xl font-bold">
              {Object.values(monthData).reduce((sum, rows) => sum + rows.length, 0)}件
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600">総工数</p>
            <p className="text-2xl font-bold">
              {Object.values(monthData)
                .reduce(
                  (sum, rows) =>
                    sum +
                    rows.reduce(
                      (rowSum, row) =>
                        rowSum + Object.values(row.workerHours).reduce((a, b) => a + b, 0),
                      0
                    ),
                  0
                )
                .toFixed(1)}
              h
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600">平均工数/日</p>
            <p className="text-2xl font-bold">
              {Object.keys(monthData).length > 0
                ? (
                    Object.values(monthData).reduce(
                      (sum, rows) =>
                        sum +
                        rows.reduce(
                          (rowSum, row) =>
                            rowSum + Object.values(row.workerHours).reduce((a, b) => a + b, 0),
                          0
                        ),
                      0
                    ) / Object.keys(monthData).length
                  ).toFixed(1)
                : 0}
              h
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
