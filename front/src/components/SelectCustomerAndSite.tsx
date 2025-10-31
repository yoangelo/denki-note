import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useListCustomers, useGetRecentCustomers } from "@/api/generated/customers/customers";
import { useListSites, useCreateSite } from "@/api/generated/sites/sites";

type SelectCustomerAndSiteProps = {
  onSelect: (ids: { customerId: string; siteId: string }) => void;
};

export function SelectCustomerAndSite({ onSelect }: SelectCustomerAndSiteProps) {
  const [query, setQuery] = useState("");
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>("");
  const [selectedSiteId, setSelectedSiteId] = useState<string>("");
  const [newSiteName, setNewSiteName] = useState("");
  const [showNewSiteForm, setShowNewSiteForm] = useState(false);
  const queryClient = useQueryClient();

  // 直近の顧客を取得
  const { data: recentCustomers, isLoading: recentCustomersLoading } = useGetRecentCustomers({
    limit: 3,
  });

  // 顧客検索
  const { data: searchedCustomers, isLoading: searchLoading } = useListCustomers({
    query: query || undefined,
    limit: 20,
  });

  // 表示する顧客リスト（検索中は検索結果、そうでなければ直近の顧客）
  const customers = query
    ? searchedCustomers
    : recentCustomers?.map((rc) => ({
        id: rc.id,
        name: rc.name,
        customer_type: rc.customer_type,
        corporation_number: rc.corporation_number,
        rate_percent: rc.rate_percent,
        unit_rate: rc.unit_rate,
      }));

  const customersLoading = query ? searchLoading : recentCustomersLoading;

  // 選択された顧客の現場一覧
  const { data: sites, isLoading: sitesLoading } = useListSites(
    { customer_id: selectedCustomerId || "" },
    {
      query: {
        enabled: !!selectedCustomerId,
        queryKey: [`/sites`, { customer_id: selectedCustomerId || "" }],
      },
    }
  );

  // 現場作成
  const createSite = useCreateSite({
    mutation: {
      onSuccess: (data) => {
        // 作成した現場の顧客IDに対応するクエリを無効化して再フェッチ
        queryClient.invalidateQueries({
          queryKey: [`/sites`, { customer_id: selectedCustomerId || "" }],
        });
        // 作成した現場を自動選択
        if (data?.id) {
          setSelectedSiteId(data.id);
          onSelect({
            customerId: selectedCustomerId,
            siteId: data.id,
          });
        }
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
          },
        },
      });
    }
  };

  return (
    <div className="p-5 font-sans">
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

        {/* 検索前の直近顧客表示時のラベル */}
        {!query && recentCustomers && recentCustomers.length > 0 && (
          <p className="mt-2 text-sm text-gray-600">最近使用した顧客:</p>
        )}

        <div className="mt-2.5">
          {customers?.map((customer) => {
            // 直近顧客の場合、関連する現場情報も取得
            const recentCustomer = !query
              ? recentCustomers?.find((rc) => rc.id === customer.id)
              : null;

            return (
              <button
                key={customer.id}
                onClick={() => {
                  setSelectedCustomerId(customer.id);
                  // 直近顧客から選択した場合、その現場も自動選択
                  if (recentCustomer?.site) {
                    setSelectedSiteId(recentCustomer.site.id);
                    onSelect({
                      customerId: customer.id,
                      siteId: recentCustomer.site.id,
                    });
                  } else {
                    setSelectedSiteId(""); // 顧客を変更したら現場選択をリセット
                  }
                  setShowNewSiteForm(false);
                }}
                className={`block p-2.5 my-1 w-full max-w-md text-left border rounded cursor-pointer transition-colors ${
                  selectedCustomerId === customer.id
                    ? "bg-blue-500 text-white border-blue-500"
                    : "bg-gray-100 text-black border-gray-300 hover:bg-gray-200"
                }`}
              >
                <div className="flex justify-between items-center">
                  <div>
                    {customer.name}
                    {customer.customer_type === "corporation" && (
                      <span className="text-sm"> (法人)</span>
                    )}
                    {customer.customer_type === "individual" && (
                      <span className="text-sm"> (個人)</span>
                    )}
                    {customer.rate_percent && customer.rate_percent !== 100 && (
                      <span className="text-sm"> - 掛率: {customer.rate_percent}%</span>
                    )}
                    {/* 直近顧客の場合、現場名も表示 */}
                    {recentCustomer?.site && (
                      <div
                        className={`text-sm mt-1 ${
                          selectedCustomerId === customer.id ? "text-blue-100" : "text-gray-600"
                        }`}
                      >
                        現場: {recentCustomer.site.name}
                      </div>
                    )}
                  </div>
                </div>
              </button>
            );
          })}
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
                onClick={() => {
                  setSelectedSiteId(site.id);
                  onSelect({
                    customerId: selectedCustomerId,
                    siteId: site.id,
                  });
                }}
                className={`block p-2.5 my-1 w-full max-w-md text-left border rounded cursor-pointer transition-colors ${
                  selectedSiteId === site.id
                    ? "bg-blue-500 text-white border-blue-500"
                    : "bg-gray-100 text-black border-gray-300 hover:bg-gray-200"
                }`}
              >
                {site.name}
                {site.note && (
                  <span className={selectedSiteId === site.id ? "text-blue-100" : "text-gray-600"}>
                    {" "}
                    - {site.note}
                  </span>
                )}
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
