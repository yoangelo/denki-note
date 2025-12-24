import { useState, useEffect } from "react";
import { useListCustomers } from "@/api/generated/customers/customers";
import { useListSites, useCreateSite } from "@/api/generated/sites/sites";
import { useQueryClient } from "@tanstack/react-query";

type CustomerSiteSelectModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (data: {
    customerId: string;
    siteId: string;
    customerName: string;
    siteName: string;
    customerType: "corporate" | "individual";
  }) => void;
  initialCustomerId?: string;
  initialSiteId?: string;
  siteRequired?: boolean;
};

export function CustomerSiteSelectModal({
  isOpen,
  onClose,
  onSelect,
  initialCustomerId,
  initialSiteId,
  siteRequired = true,
}: CustomerSiteSelectModalProps) {
  const [query, setQuery] = useState("");
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>(initialCustomerId || "");
  const [selectedSiteId, setSelectedSiteId] = useState<string>(initialSiteId || "");
  const [newSiteName, setNewSiteName] = useState("");
  const [showNewSiteForm, setShowNewSiteForm] = useState(false);
  const queryClient = useQueryClient();

  useEffect(() => {
    if (isOpen) {
      setSelectedCustomerId(initialCustomerId || "");
      setSelectedSiteId(initialSiteId || "");
      setQuery("");
    }
  }, [isOpen, initialCustomerId, initialSiteId]);

  const { data: searchedCustomers, isLoading: searchLoading } = useListCustomers({
    query: query || undefined,
    limit: 20,
  });

  const { data: sites, isLoading: sitesLoading } = useListSites(
    { customer_id: selectedCustomerId || "" },
    {
      query: {
        enabled: !!selectedCustomerId,
        queryKey: [`/sites`, { customer_id: selectedCustomerId || "" }],
      },
    }
  );

  const createSite = useCreateSite({
    mutation: {
      onSuccess: (data) => {
        queryClient.invalidateQueries({
          queryKey: [`/sites`, { customer_id: selectedCustomerId || "" }],
        });
        if (data?.id) {
          setSelectedSiteId(data.id);
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

  const handleSelect = () => {
    const canSelect = siteRequired ? selectedCustomerId && selectedSiteId : selectedCustomerId;

    if (canSelect) {
      const customer = searchedCustomers?.find((c) => c.id === selectedCustomerId);
      const site = selectedSiteId ? sites?.find((s) => s.id === selectedSiteId) : null;

      if (customer && (site || !siteRequired || !selectedSiteId)) {
        onSelect({
          customerId: selectedCustomerId,
          siteId: selectedSiteId,
          customerName: customer.name,
          siteName: site?.name || "",
          customerType: customer.customer_type,
        });
        onClose();
      }
    }
  };

  const handleCustomerClick = (customerId: string) => {
    setSelectedCustomerId(customerId);
    setSelectedSiteId("");
    setShowNewSiteForm(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[80vh] flex flex-col">
        {/* ヘッダー */}
        <div className="px-6 py-5 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-xl font-semibold text-gray-900">顧客・現場選択</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-md hover:bg-gray-100 text-gray-500 text-2xl"
          >
            ×
          </button>
        </div>

        {/* ボディ */}
        <div className="flex-1 overflow-y-auto px-6 py-6">
          {/* 顧客検索セクション */}
          <div className="mb-8">
            <div className="flex items-center mb-3">
              <h3 className="text-base font-semibold text-gray-700">1. 顧客を選択</h3>
              {selectedCustomerId && <span className="ml-2 text-lg text-green-600">✓</span>}
            </div>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="顧客名で検索..."
              className="w-full px-3 py-2.5 border-2 border-gray-300 rounded-lg text-sm outline-none transition-colors focus:border-blue-500"
            />

            {searchLoading && <p className="mt-2 text-gray-600 text-sm">読み込み中...</p>}

            <div className="mt-3 space-y-2">
              {searchedCustomers?.map((customer) => (
                <button
                  key={customer.id}
                  onClick={() => handleCustomerClick(customer.id)}
                  className={`block w-full text-left p-3 border-2 rounded-lg cursor-pointer transition-all ${
                    selectedCustomerId === customer.id
                      ? "bg-blue-50 border-blue-500"
                      : "bg-gray-50 border-gray-200 hover:bg-gray-100 hover:border-gray-300"
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-900">{customer.name}</span>
                      {customer.customer_type === "corporate" && (
                        <span className="text-xs text-gray-600">(法人)</span>
                      )}
                      {customer.customer_type === "individual" && (
                        <span className="text-xs text-gray-600">(個人)</span>
                      )}
                      {customer.rate_percent && customer.rate_percent !== 100 && (
                        <span className="text-xs text-gray-600">
                          - 掛率: {customer.rate_percent}%
                        </span>
                      )}
                    </div>
                    {selectedCustomerId === customer.id && (
                      <span className="text-blue-600 font-bold text-lg">✓</span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* 現場選択セクション */}
          <div>
            <div className="flex items-center mb-3">
              <h3 className="text-base font-semibold text-gray-700">
                2. 現場を選択{!siteRequired && "（任意）"}
              </h3>
              {selectedSiteId && <span className="ml-2 text-lg text-green-600">✓</span>}
            </div>

            {!selectedCustomerId ? (
              <div className="py-10 text-center text-gray-400">
                <div className="text-5xl mb-3">🏗️</div>
                <div className="text-sm">先に顧客を選択してください</div>
              </div>
            ) : (
              <>
                {sitesLoading && <p className="text-gray-600 text-sm">読み込み中...</p>}

                <div className="space-y-2">
                  {sites?.map((site) => (
                    <button
                      key={site.id}
                      onClick={() => setSelectedSiteId(site.id)}
                      className={`block w-full text-left p-3 border-2 rounded-lg cursor-pointer transition-all ${
                        selectedSiteId === site.id
                          ? "bg-blue-50 border-blue-500"
                          : "bg-gray-50 border-gray-200 hover:bg-gray-100 hover:border-gray-300"
                      }`}
                    >
                      <div className="flex justify-between items-center">
                        <div>
                          <span className="font-medium text-gray-900">{site.name}</span>
                          {site.address && (
                            <span className="text-sm text-gray-600 ml-2">- {site.address}</span>
                          )}
                        </div>
                        {selectedSiteId === site.id && (
                          <span className="text-blue-600 font-bold text-lg">✓</span>
                        )}
                      </div>
                    </button>
                  ))}

                  {!showNewSiteForm && (
                    <button
                      onClick={() => setShowNewSiteForm(true)}
                      className="mt-3 px-5 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
                    >
                      + 新しい現場を追加
                    </button>
                  )}

                  {showNewSiteForm && (
                    <div className="mt-3 p-4 bg-gray-50 rounded-lg">
                      <input
                        type="text"
                        value={newSiteName}
                        onChange={(e) => setNewSiteName(e.target.value)}
                        placeholder="現場名を入力"
                        className="px-3 py-2 w-64 text-sm border border-gray-300 rounded mr-2.5"
                      />
                      <button
                        onClick={handleCreateSite}
                        disabled={!newSiteName.trim() || createSite.isPending}
                        className={`px-4 py-2 bg-blue-500 text-white rounded transition-opacity text-sm ${
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
                        className="ml-2.5 px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors text-sm"
                      >
                        キャンセル
                      </button>
                      {createSite.isError && (
                        <p className="text-red-500 mt-2.5 text-sm">
                          エラー: {(createSite.error as Error).message}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>

        {/* フッター */}
        <div className="px-6 py-4 border-t border-gray-200 flex justify-between items-center">
          <div className="text-sm text-gray-600">
            {siteRequired
              ? selectedCustomerId && selectedSiteId
                ? "顧客と現場が選択されています"
                : "顧客と現場の両方を選択してください"
              : selectedCustomerId
                ? selectedSiteId
                  ? "顧客と現場が選択されています"
                  : "顧客が選択されています（現場は任意）"
                : "顧客を選択してください（現場は任意）"}
          </div>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-6 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium"
            >
              キャンセル
            </button>
            <button
              onClick={handleSelect}
              disabled={siteRequired ? !selectedCustomerId || !selectedSiteId : !selectedCustomerId}
              className={`px-6 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                (siteRequired ? selectedCustomerId && selectedSiteId : selectedCustomerId)
                  ? "bg-blue-500 text-white hover:bg-blue-600"
                  : "bg-gray-300 text-gray-500 cursor-not-allowed"
              }`}
            >
              選択
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
