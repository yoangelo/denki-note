import { useState } from "react";
import { CustomerSiteSelectModal } from "./CustomerSiteSelectModal";
import { RecentCustomers } from "./RecentCustomers";

type CustomerSiteSelectorProps = {
  customerId?: string;
  siteId?: string;
  customerName?: string;
  siteName?: string;
  customerType?: "corporate" | "individual";
  onSelect: (data: {
    customerId: string;
    siteId: string;
    customerName?: string;
    siteName?: string;
    customerType?: "corporate" | "individual";
  }) => void;
  showRecentCustomers?: boolean;
};

export function CustomerSiteSelector({
  customerId,
  siteId,
  customerName: initialCustomerName,
  siteName: initialSiteName,
  customerType: initialCustomerType,
  onSelect,
  showRecentCustomers = false,
}: CustomerSiteSelectorProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCustomerName, setSelectedCustomerName] = useState(initialCustomerName);
  const [selectedSiteName, setSelectedSiteName] = useState(initialSiteName);
  const [selectedCustomerType, setSelectedCustomerType] = useState(initialCustomerType);

  const handleSelect = (data: {
    customerId: string;
    siteId: string;
    customerName: string;
    siteName: string;
    customerType: "corporate" | "individual";
  }) => {
    setSelectedCustomerName(data.customerName);
    setSelectedSiteName(data.siteName);
    setSelectedCustomerType(data.customerType);
    onSelect(data);
  };

  const hasSelection = customerId && siteId;

  return (
    <>
      {!hasSelection ? (
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 bg-gray-50 text-center">
          <div className="text-5xl mb-3 opacity-50">🏗️</div>
          <div className="text-sm text-gray-600 mb-4">顧客と現場を選択してください</div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center gap-2 px-8 py-3 bg-blue-500 text-white font-medium rounded-lg hover:bg-blue-600 transition-all hover:-translate-y-0.5 shadow-lg hover:shadow-xl"
          >
            <span>📋</span>
            <span>現場選択</span>
          </button>

          {showRecentCustomers && <RecentCustomers onSelect={handleSelect} />}
        </div>
      ) : (
        <div className="border-2 border-gray-200 rounded-lg overflow-hidden bg-white">
          <div className="px-4 py-4 bg-gray-50">
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-base font-semibold text-gray-900">
                {selectedCustomerName || initialCustomerName}
              </span>
              {(selectedCustomerType || initialCustomerType) === "corporate" && (
                <span className="text-xs px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded">
                  法人
                </span>
              )}
              {(selectedCustomerType || initialCustomerType) === "individual" && (
                <span className="text-xs px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded">
                  個人
                </span>
              )}
            </div>
            <div className="flex items-center gap-1.5 text-sm text-gray-600">
              <span>🏗️</span>
              <span>{selectedSiteName || initialSiteName}</span>
            </div>
          </div>
          <div className="px-4 py-3 bg-white border-t border-gray-200 flex justify-end">
            <button
              onClick={() => setIsModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors text-sm font-medium"
            >
              <span>🔄</span>
              <span>変更</span>
            </button>
          </div>
        </div>
      )}

      <CustomerSiteSelectModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSelect={handleSelect}
        initialCustomerId={customerId}
        initialSiteId={siteId}
      />
    </>
  );
}
