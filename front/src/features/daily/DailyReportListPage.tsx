import { useState, useMemo } from "react";
import { format } from "date-fns";
import { DailyReportList } from "./DailyReportList";
import { useListUsers } from "@/api/generated/users/users";
import { useListDailyReports } from "@/api/generated/daily-reports/daily-reports";

// データ型定義
type WorkRow = {
  id: string;
  customerName: string;
  siteName: string;
  summary: string;
  workerHours: Record<string, number>;
};

export function DailyReportListPage() {
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return format(now, "yyyy-MM");
  });

  // APIから作業者一覧を取得
  const { data: users = [] } = useListUsers({ is_active: true });

  // APIから日報一覧を取得
  const { data: dailyReportsData, isLoading } = useListDailyReports({
    year_month: selectedMonth,
    limit: 500,
  });

  // APIレスポンスを画面表示用の形式に変換
  const monthData = useMemo(() => {
    if (!dailyReportsData?.daily_reports) return {};

    const grouped: Record<string, WorkRow[]> = {};

    dailyReportsData.daily_reports.forEach((report) => {
      const dateKey = report.work_date;

      if (!grouped[dateKey]) {
        grouped[dateKey] = [];
      }

      // work_entriesをworker別にグループ化
      const workerHours: Record<string, number> = {};
      report.work_entries.forEach((entry) => {
        workerHours[entry.user.id] = (workerHours[entry.user.id] || 0) + entry.minutes / 60;
      });

      grouped[dateKey].push({
        id: report.id,
        customerName: report.customer.name,
        siteName: report.site.name,
        summary: report.summary,
        workerHours,
      });
    });

    return grouped;
  }, [dailyReportsData]);

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

      {/* ローディング中 */}
      {isLoading ? (
        <div className="text-center py-12">
          <p className="text-gray-500">読み込み中...</p>
        </div>
      ) : /* 日報一覧 */
      Object.keys(monthData).length > 0 ? (
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
