import { useGetRecentCustomers } from "@/api/generated/customers/customers";
import { format } from "date-fns";

type RecentCustomersProps = {
  onSelect: (data: {
    customerId: string;
    siteId: string;
    customerName: string;
    siteName: string;
    customerType: "corporate" | "individual";
  }) => void;
};

export function RecentCustomers({ onSelect }: RecentCustomersProps) {
  const { data: recentCustomers, isLoading } = useGetRecentCustomers({
    limit: 3,
  });

  if (isLoading) {
    return null;
  }

  if (!recentCustomers || recentCustomers.length === 0) {
    return null;
  }

  return (
    <div className="mt-5 pt-5 border-t border-gray-300">
      <div className="flex items-center mb-2.5">
        <span className="text-sm mr-1.5">🕐</span>
        <span className="text-xs font-medium text-gray-600">最近使用した顧客</span>
      </div>
      <div className="space-y-1.5">
        {recentCustomers.map((recentCustomer) => {
          if (!recentCustomer.site) return null;

          return (
            <button
              key={`${recentCustomer.id}-${recentCustomer.site.id}`}
              onClick={() =>
                onSelect({
                  customerId: recentCustomer.id,
                  siteId: recentCustomer.site!.id,
                  customerName: recentCustomer.name,
                  siteName: recentCustomer.site!.name,
                  customerType: (recentCustomer.customer_type || "corporate") as
                    | "corporate"
                    | "individual",
                })
              }
              className="w-full px-3 py-2.5 bg-white border-2 border-gray-200 rounded-md cursor-pointer transition-all hover:bg-gray-50 hover:border-blue-500 hover:translate-x-1 flex justify-between items-center"
            >
              <div className="flex-1 text-left">
                <div className="text-xs font-medium text-gray-900 mb-0.5">
                  {recentCustomer.name}
                </div>
                <div className="text-[11px] text-gray-600">🏗️ {recentCustomer.site.name}</div>
              </div>
              <div className="text-[10px] text-gray-400">
                {format(new Date(recentCustomer.last_used_at), "M/d")}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
