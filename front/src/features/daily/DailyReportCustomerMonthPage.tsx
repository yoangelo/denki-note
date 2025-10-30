import { useState } from "react";
import { DailyReportCustomerMonth } from "./DailyReportCustomerMonth";
import { useListCustomers } from "@/api/generated/customers/customers";

type SelectedCustomer = {
  id: string;
  name: string;
};

export function DailyReportCustomerMonthPage() {
  const [selectedCustomer, setSelectedCustomer] = useState<SelectedCustomer | null>(null);
  const { data: customers } = useListCustomers();

  return (
    <div>
      {selectedCustomer ? (
        <DailyReportCustomerMonth
          customerId={selectedCustomer.id}
          customerName={selectedCustomer.name}
          onBack={() => setSelectedCustomer(null)}
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
  );
}
