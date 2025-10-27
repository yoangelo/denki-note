import { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { DailyReportEntry } from "./features/daily/DailyReportEntry";
import { DailyReportListPage } from "./features/daily/DailyReportListPage";
import { CustomerMonth } from "./features/summary/CustomerMonth";
import { useListCustomers } from "./api/generated/customers/customers";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 60 * 1000, // 1分
    },
  },
});

type ViewMode = "daily" | "list" | "summary";

interface SelectedCustomer {
  id: string;
  name: string;
}

function MainApp() {
  const [viewMode, setViewMode] = useState<ViewMode>("daily");
  const [selectedCustomer, setSelectedCustomer] = useState<SelectedCustomer | null>(null);

  const { data: customers } = useListCustomers();

  return (
    <div className="font-sans min-h-screen bg-gray-100">
      {/* ヘッダー */}
      <header className="bg-gray-800 text-white p-5 mb-5">
        <h1 className="m-0 text-3xl font-bold">日報管理システム MVP</h1>
        <p className="mt-2.5 opacity-80">工数記録から請求予定額までをワンストップで管理</p>
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
          <DailyReportEntry />
        ) : viewMode === "list" ? (
          <DailyReportListPage />
        ) : (
          <div>
            {/* 月次集計 */}
            {selectedCustomer ? (
              <CustomerMonth
                customerId={selectedCustomer.id}
                customerName={selectedCustomer.name}
              />
            ) : (
              <div className="text-center p-10 bg-gray-50 rounded-lg">
                <h3 className="text-xl font-semibold mb-4">顧客を選択してください</h3>
                <p className="text-gray-600 mb-5">
                  日報入力タブから顧客と現場を選択すると、月次集計が表示されます。
                </p>

                {/* クイック選択 */}
                {customers && customers.length > 0 && (
                  <div className="mt-5">
                    <h4 className="text-lg font-semibold mb-3">クイック選択</h4>
                    <div className="flex gap-2.5 justify-center flex-wrap">
                      {customers.map((customer) => (
                        <button
                          key={customer.id}
                          onClick={() =>
                            setSelectedCustomer({ id: customer.id, name: customer.name })
                          }
                          className="px-5 py-2.5 bg-blue-500 text-white border-none rounded cursor-pointer hover:bg-blue-600 transition-colors"
                        >
                          {customer.name}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </main>

      {/* フッター */}
      <footer className="mt-10 p-5 bg-gray-50 text-center border-t border-gray-300">
        <p className="m-0 text-gray-500">MVP実装デモ - Rails API + React TypeScript + OpenAPI</p>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <MainApp />
    </QueryClientProvider>
  );
}
