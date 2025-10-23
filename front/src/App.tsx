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
  const [workEntries, setWorkEntries] = useState<any[]>([]);

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
    <div style={{ fontFamily: "sans-serif", minHeight: "100vh", backgroundColor: "#f5f5f5" }}>
      {/* ヘッダー */}
      <header style={{
        backgroundColor: "#343a40",
        color: "white",
        padding: "20px",
        marginBottom: "20px",
      }}>
        <h1 style={{ margin: 0 }}>日報管理システム MVP</h1>
        <p style={{ margin: "10px 0 0 0", opacity: 0.8 }}>
          工数記録から請求予定額までをワンストップで管理
        </p>
      </header>

      {/* ビューモード切替 */}
      <div style={{ 
        padding: "0 20px 20px", 
        display: "flex", 
        gap: "10px",
        borderBottom: "2px solid #dee2e6",
      }}>
        <button
          onClick={() => setViewMode("daily")}
          style={{
            padding: "10px 20px",
            backgroundColor: viewMode === "daily" ? "#007bff" : "#6c757d",
            color: "white",
            border: "none",
            borderRadius: "4px 4px 0 0",
            cursor: "pointer",
            fontSize: "16px",
          }}
        >
          日報入力
        </button>
        <button
          onClick={() => setViewMode("summary")}
          style={{
            padding: "10px 20px",
            backgroundColor: viewMode === "summary" ? "#007bff" : "#6c757d",
            color: "white",
            border: "none",
            borderRadius: "4px 4px 0 0",
            cursor: "pointer",
            fontSize: "16px",
          }}
        >
          月次集計
        </button>
      </div>

      {/* メインコンテンツ */}
      <main style={{ padding: "20px", backgroundColor: "white", margin: "20px", borderRadius: "8px" }}>
        {viewMode === "daily" ? (
          <div>
            {/* 顧客・現場選択 */}
            <SelectCustomerAndSite onSelect={handleCustomerSiteSelect} />
            
            {/* バルク保存 */}
            {workEntries.length > 0 && (
              <div style={{ marginTop: "40px", borderTop: "2px solid #dee2e6", paddingTop: "20px" }}>
                <BulkSave 
                  entries={workEntries} 
                  onSuccess={handleBulkSaveSuccess}
                />
              </div>
            )}
            
            {/* 選択情報表示 */}
            {selectedCustomer && selectedSiteId && (
              <div style={{
                marginTop: "20px",
                padding: "15px",
                backgroundColor: "#e7f3ff",
                borderRadius: "4px",
                border: "1px solid #007bff",
              }}>
                <h4>選択中の情報</h4>
                <p>顧客: {selectedCustomer.name}</p>
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
              <div style={{
                textAlign: "center",
                padding: "40px",
                backgroundColor: "#f8f9fa",
                borderRadius: "8px",
              }}>
                <h3>顧客を選択してください</h3>
                <p>日報入力タブから顧客と現場を選択すると、月次集計が表示されます。</p>
                
                {/* クイック選択 */}
                {customers && customers.length > 0 && (
                  <div style={{ marginTop: "20px" }}>
                    <h4>クイック選択</h4>
                    <div style={{ display: "flex", gap: "10px", justifyContent: "center", flexWrap: "wrap" }}>
                      {customers.map(customer => (
                        <button
                          key={customer.id}
                          onClick={() => setSelectedCustomer({ id: customer.id, name: customer.name })}
                          style={{
                            padding: "10px 20px",
                            backgroundColor: "#007bff",
                            color: "white",
                            border: "none",
                            borderRadius: "4px",
                            cursor: "pointer",
                          }}
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
      <footer style={{
        marginTop: "40px",
        padding: "20px",
        backgroundColor: "#f8f9fa",
        textAlign: "center",
        borderTop: "1px solid #dee2e6",
      }}>
        <p style={{ margin: 0, color: "#6c757d" }}>
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
