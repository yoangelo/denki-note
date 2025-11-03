import { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { DailyReportEntryPage } from "./features/daily/DailyReportEntryPage";
import { DailyReportListPage } from "./features/daily/DailyReportListPage";
import { DailyReportCustomerMonthPage } from "./features/daily/DailyReportCustomerMonthPage";
import { PrivateRoute } from "./components/PrivateRoute";
import { useAuthStore } from "./stores/authStore";
import { httpClient } from "./api/mutator";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 60 * 1000, // 1分
    },
  },
});

type ViewMode = "daily" | "list" | "summary";

function MainApp() {
  const [viewMode, setViewMode] = useState<ViewMode>("daily");
  const { user, logout } = useAuthStore();

  const handleLogout = async () => {
    try {
      await httpClient({
        url: "/auth/logout",
        method: "DELETE",
      });
    } catch (err) {
      console.error("Logout error:", err);
    } finally {
      logout();
    }
  };

  return (
    <div className="font-sans min-h-screen bg-gray-100">
      {/* ヘッダー */}
      <header className="bg-gray-800 text-white p-5 mb-5">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="m-0 text-3xl font-bold">日報管理システム</h1>
            <p className="mt-2.5 opacity-80">工数記録から請求予定額までをワンストップで管理</p>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm opacity-80">
              {user?.display_name} ({user?.roles?.includes("admin") ? "管理者" : "メンバー"})
            </span>
            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded transition-colors"
            >
              ログアウト
            </button>
          </div>
        </div>
      </header>

      {/* ビューモード切替 */}
      <div className="px-5 pb-5 flex gap-2.5 border-b-2 border-gray-300">
        <button
          onClick={() => setViewMode("daily")}
          className={`px-5 py-2.5 text-white border-none rounded-t cursor-pointer text-base transition-colors ${
            viewMode === "daily" ? "bg-blue-500" : "bg-gray-500"
          }`}
        >
          日報入力
        </button>
        <button
          onClick={() => setViewMode("list")}
          className={`px-5 py-2.5 text-white border-none rounded-t cursor-pointer text-base transition-colors ${
            viewMode === "list" ? "bg-blue-500" : "bg-gray-500"
          }`}
        >
          日報一覧
        </button>
        <button
          onClick={() => setViewMode("summary")}
          className={`px-5 py-2.5 text-white border-none rounded-t cursor-pointer text-base transition-colors ${
            viewMode === "summary" ? "bg-blue-500" : "bg-gray-500"
          }`}
        >
          月次集計
        </button>
      </div>

      {/* メインコンテンツ */}
      <main className="p-5 bg-white m-5 rounded-lg">
        {viewMode === "daily" ? (
          <DailyReportEntryPage />
        ) : viewMode === "list" ? (
          <DailyReportListPage />
        ) : (
          <DailyReportCustomerMonthPage />
        )}
      </main>

      {/* フッター */}
      <footer className="mt-10 p-5 bg-gray-50 text-center border-t border-gray-300">
        {/* フッターコンテンツ */}
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <PrivateRoute>
        <MainApp />
      </PrivateRoute>
    </QueryClientProvider>
  );
}
