import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useListCustomers } from "@/api/generated/customers/customers";
import { useListSites, useCreateSite } from "@/api/generated/sites/sites";

interface SelectCustomerAndSiteProps {
  onSelect: (ids: { customerId: string; siteId: string }) => void;
}

export function SelectCustomerAndSite({ onSelect }: SelectCustomerAndSiteProps) {
  const [query, setQuery] = useState("");
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>("");
  const [newSiteName, setNewSiteName] = useState("");
  const [showNewSiteForm, setShowNewSiteForm] = useState(false);
  const queryClient = useQueryClient();

  // 顧客検索
  const { data: customers, isLoading: customersLoading } = useListCustomers(
    { query: query || undefined, limit: 20 }
  );

  // 選択された顧客の現場一覧
  const { data: sites, isLoading: sitesLoading } = useListSites(
    { customer_id: selectedCustomerId || "" },
    selectedCustomerId ? undefined : { query: { enabled: false } as any }
  );

  // 現場作成
  const createSite = useCreateSite({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["listSites"] });
        setNewSiteName("");
        setShowNewSiteForm(false);
      },
    },
  });

  const handleCreateSite = () => {
    if (selectedCustomerId && newSiteName.trim()) {
      createSite.mutate({
        data: {
          site: {
            customer_id: selectedCustomerId,
            name: newSiteName.trim(),
          }
        },
      });
    }
  };

  return (
    <div style={{ padding: "20px", fontFamily: "sans-serif" }}>
      <h2>日報入力</h2>
      
      {/* 顧客検索 */}
      <div style={{ marginBottom: "20px" }}>
        <h3>1. 顧客を選択</h3>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="顧客名で検索..."
          style={{
            padding: "8px",
            width: "300px",
            fontSize: "16px",
            border: "1px solid #ccc",
            borderRadius: "4px",
          }}
        />
        
        {customersLoading && <p>読み込み中...</p>}
        
        <div style={{ marginTop: "10px" }}>
          {customers?.map((customer) => (
            <button
              key={customer.id}
              onClick={() => {
                setSelectedCustomerId(customer.id);
                setShowNewSiteForm(false);
              }}
              style={{
                display: "block",
                padding: "10px",
                margin: "5px 0",
                width: "100%",
                maxWidth: "400px",
                textAlign: "left",
                backgroundColor: selectedCustomerId === customer.id ? "#007bff" : "#f0f0f0",
                color: selectedCustomerId === customer.id ? "white" : "black",
                border: "1px solid #ccc",
                borderRadius: "4px",
                cursor: "pointer",
              }}
            >
              {customer.name}
              {customer.customer_type === "corporation" && " (法人)"}
              {customer.customer_type === "individual" && " (個人)"}
              {customer.rate_percent && customer.rate_percent !== 100 && 
                ` - 掛率: ${customer.rate_percent}%`}
            </button>
          ))}
        </div>
      </div>

      {/* 現場選択 */}
      {selectedCustomerId && (
        <div style={{ marginBottom: "20px" }}>
          <h3>2. 現場を選択</h3>
          
          {sitesLoading && <p>読み込み中...</p>}
          
          <div style={{ marginTop: "10px" }}>
            {sites?.map((site) => (
              <button
                key={site.id}
                onClick={() => onSelect({ 
                  customerId: selectedCustomerId, 
                  siteId: site.id 
                })}
                style={{
                  display: "block",
                  padding: "10px",
                  margin: "5px 0",
                  width: "100%",
                  maxWidth: "400px",
                  textAlign: "left",
                  backgroundColor: "#e8f4f8",
                  border: "1px solid #007bff",
                  borderRadius: "4px",
                  cursor: "pointer",
                }}
              >
                {site.name}
                {site.note && <span style={{ fontSize: "12px", color: "#666" }}> - {site.note}</span>}
              </button>
            ))}
            
            {/* 現場追加ボタン */}
            {!showNewSiteForm && (
              <button
                onClick={() => setShowNewSiteForm(true)}
                style={{
                  marginTop: "10px",
                  padding: "10px 20px",
                  backgroundColor: "#28a745",
                  color: "white",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer",
                }}
              >
                + 新しい現場を追加
              </button>
            )}
            
            {/* 現場追加フォーム */}
            {showNewSiteForm && (
              <div style={{ marginTop: "10px", padding: "15px", backgroundColor: "#f9f9f9", borderRadius: "4px" }}>
                <input
                  type="text"
                  value={newSiteName}
                  onChange={(e) => setNewSiteName(e.target.value)}
                  placeholder="現場名を入力"
                  style={{
                    padding: "8px",
                    width: "250px",
                    fontSize: "16px",
                    border: "1px solid #ccc",
                    borderRadius: "4px",
                    marginRight: "10px",
                  }}
                />
                <button
                  onClick={handleCreateSite}
                  disabled={!newSiteName.trim() || createSite.isPending}
                  style={{
                    padding: "8px 16px",
                    backgroundColor: "#007bff",
                    color: "white",
                    border: "none",
                    borderRadius: "4px",
                    cursor: newSiteName.trim() ? "pointer" : "not-allowed",
                    opacity: newSiteName.trim() ? 1 : 0.5,
                  }}
                >
                  {createSite.isPending ? "作成中..." : "作成"}
                </button>
                <button
                  onClick={() => {
                    setShowNewSiteForm(false);
                    setNewSiteName("");
                  }}
                  style={{
                    marginLeft: "10px",
                    padding: "8px 16px",
                    backgroundColor: "#6c757d",
                    color: "white",
                    border: "none",
                    borderRadius: "4px",
                    cursor: "pointer",
                  }}
                >
                  キャンセル
                </button>
                {createSite.isError && (
                  <p style={{ color: "red", marginTop: "10px" }}>
                    エラー: {(createSite.error as Error).message}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}