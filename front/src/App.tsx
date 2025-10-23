import { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { SelectCustomerAndSite } from "./features/daily/SelectCustomerAndSite";
import { BulkSave } from "./features/daily/BulkSave";
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

type ViewMode = "daily" | "summary";

interface SelectedCustomer {
  id: string;
  name: string;
}

function MainApp() {
  const [viewMode, setViewMode] = useState<ViewMode>("daily");
  const [selectedCustomer, setSelectedCustomer] = useState<SelectedCustomer | null>(null);
  const [selectedSiteId, setSelectedSiteId] = useState<string>("");
  
  // サンプル用の作業エントリ（実際はフォームから入力）
  interface WorkEntry {
    client_entry_id: string;
    daily_report_id: string;
    user_id: string;
    summary: string;
    minutes: number;
  }
  const [workEntries, setWorkEntries] = useState<WorkEntry[]>([]);

  const { data: customers } = useListCustomers();

  const handleCustomerSiteSelect = (ids: { customerId: string; siteId: string }) => {
    const customer = customers?.find(c => c.id === ids.customerId);
    if (customer) {
      setSelectedCustomer({ id: customer.id, name: customer.name });
    }
    setSelectedSiteId(ids.siteId);
    
    // デモ用：選択後にサンプルエントリを作成
    const sampleEntry = {
      client_entry_id: `entry_${Date.now()}`,
      daily_report_id: "sample_report_id", // 実際は日報IDを使用
      user_id: "sample_user_id", // 実際はユーザーIDを使用
      summary: "サンプル作業",
      minutes: 120, // 2時間
    };
    setWorkEntries([sampleEntry]);
    
    alert(`選択完了！\n顧客: ${customer?.name}\n現場ID: ${ids.siteId}`);
  };

  const handleBulkSaveSuccess = () => {
    setWorkEntries([]);
    alert("保存が完了しました！");
  };

  return (
    <div className="font-sans min-h-screen bg-gray-100">
      {/* ヘッダー */}
      <header className="bg-gray-800 text-white p-5 mb-5">
        <h1 className="m-0 text-3xl font-bold">日報管理システム MVP</h1>
        <p className="mt-2.5 opacity-80">
          工数記録から請求予定額までをワンストップで管理
        </p>
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
          <div>
            {/* 顧客・現場選択 */}
            <SelectCustomerAndSite onSelect={handleCustomerSiteSelect} />
            
            {/* バルク保存 */}
            {workEntries.length > 0 && (
              <div className="mt-10 border-t-2 border-gray-300 pt-5">
                <BulkSave 
                  entries={workEntries} 
                  onSuccess={handleBulkSaveSuccess}
                />
              </div>
            )}
            
            {/* 選択情報表示 */}
            {selectedCustomer && selectedSiteId && (
              <div className="mt-5 p-4 bg-blue-50 rounded border border-blue-500">
                <h4 className="text-lg font-semibold mb-2">選択中の情報</h4>
                <p className="mb-1">顧客: {selectedCustomer.name}</p>
                <p>現場ID: {selectedSiteId}</p>
              </div>
            )}
          </div>
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
                <p className="text-gray-600 mb-5">日報入力タブから顧客と現場を選択すると、月次集計が表示されます。</p>
                
                {/* クイック選択 */}
                {customers && customers.length > 0 && (
                  <div className="mt-5">
                    <h4 className="text-lg font-semibold mb-3">クイック選択</h4>
                    <div className="flex gap-2.5 justify-center flex-wrap">
                      {customers.map(customer => (
                        <button
                          key={customer.id}
                          onClick={() => setSelectedCustomer({ id: customer.id, name: customer.name })}
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
        <p className="m-0 text-gray-500">
          MVP実装デモ - Rails API + React TypeScript + OpenAPI
        </p>
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
