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
    { 
      query: { 
        enabled: !!selectedCustomerId,
        queryKey: [`/sites`, { customer_id: selectedCustomerId || "" }] 
      } 
    }
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
    <div className="p-5 font-sans">
      <h2 className="text-2xl font-bold mb-5">日報入力</h2>
      
      {/* 顧客検索 */}
      <div className="mb-5">
        <h3 className="text-lg font-semibold mb-3">1. 顧客を選択</h3>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="顧客名で検索..."
          className="p-2 w-full max-w-sm text-base border border-gray-300 rounded"
        />
        
        {customersLoading && <p className="mt-2 text-gray-600">読み込み中...</p>}
        
        <div className="mt-2.5">
          {customers?.map((customer) => (
            <button
              key={customer.id}
              onClick={() => {
                setSelectedCustomerId(customer.id);
                setShowNewSiteForm(false);
              }}
              className={`block p-2.5 my-1 w-full max-w-md text-left border rounded cursor-pointer transition-colors ${
                selectedCustomerId === customer.id 
                  ? "bg-blue-500 text-white border-blue-500" 
                  : "bg-gray-100 text-black border-gray-300 hover:bg-gray-200"
              }`}
            >
              {customer.name}
              {customer.customer_type === "corporation" && <span className="text-sm"> (法人)</span>}
              {customer.customer_type === "individual" && <span className="text-sm"> (個人)</span>}
              {customer.rate_percent && customer.rate_percent !== 100 && 
                <span className="text-sm"> - 掛率: {customer.rate_percent}%</span>}
            </button>
          ))}
        </div>
      </div>

      {/* 現場選択 */}
      {selectedCustomerId && (
        <div className="mb-5">
          <h3 className="text-lg font-semibold mb-3">2. 現場を選択</h3>
          
          {sitesLoading && <p className="text-gray-600">読み込み中...</p>}
          
          <div className="mt-2.5">
            {sites?.map((site) => (
              <button
                key={site.id}
                onClick={() => onSelect({ 
                  customerId: selectedCustomerId, 
                  siteId: site.id 
                })}
                className="block p-2.5 my-1 w-full max-w-md text-left bg-blue-50 border border-blue-500 rounded cursor-pointer hover:bg-blue-100 transition-colors"
              >
                {site.name}
                {site.note && <span className="text-xs text-gray-600"> - {site.note}</span>}
              </button>
            ))}
            
            {/* 現場追加ボタン */}
            {!showNewSiteForm && (
              <button
                onClick={() => setShowNewSiteForm(true)}
                className="mt-2.5 px-5 py-2.5 bg-green-600 text-white border-none rounded cursor-pointer hover:bg-green-700 transition-colors"
              >
                + 新しい現場を追加
              </button>
            )}
            
            {/* 現場追加フォーム */}
            {showNewSiteForm && (
              <div className="mt-2.5 p-4 bg-gray-50 rounded">
                <input
                  type="text"
                  value={newSiteName}
                  onChange={(e) => setNewSiteName(e.target.value)}
                  placeholder="現場名を入力"
                  className="p-2 w-64 text-base border border-gray-300 rounded mr-2.5"
                />
                <button
                  onClick={handleCreateSite}
                  disabled={!newSiteName.trim() || createSite.isPending}
                  className={`px-4 py-2 bg-blue-500 text-white border-none rounded transition-opacity ${
                    newSiteName.trim() 
                      ? "cursor-pointer hover:bg-blue-600" 
                      : "cursor-not-allowed opacity-50"
                  }`}
                >
                  {createSite.isPending ? "作成中..." : "作成"}
                </button>
                <button
                  onClick={() => {
                    setShowNewSiteForm(false);
                    setNewSiteName("");
                  }}
                  className="ml-2.5 px-4 py-2 bg-gray-500 text-white border-none rounded cursor-pointer hover:bg-gray-600 transition-colors"
                >
                  キャンセル
                </button>
                {createSite.isError && (
                  <p className="text-red-500 mt-2.5">
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