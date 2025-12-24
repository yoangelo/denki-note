import { useState } from "react";
import { useGetCustomerMonthSummary } from "@/api/generated/summaries/summaries";

type CustomerMonthProps = {
  customerId: string;
  customerName?: string;
  onBack?: () => void;
};

export function DailyReportCustomerMonth({ customerId, customerName, onBack }: CustomerMonthProps) {
  const today = new Date();
  const currentYearMonth = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`;

  const [yyyymm, setYyyymm] = useState(currentYearMonth);

  const { data, isLoading, error, refetch } = useGetCustomerMonthSummary({
    customer_id: customerId,
    yyyymm: yyyymm,
  });

  const handleMonthChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // YYYY-MM形式に変換
    if (value.match(/^\d{4}-\d{2}$/)) {
      setYyyymm(value);
    }
  };

  if (!customerId) {
    return <div>顧客を選択してください</div>;
  }

  return (
    <div className="p-5 font-sans">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h2 className="text-2xl font-bold mb-3">月次集計</h2>
          {customerName && <h3 className="text-lg mb-4">顧客: {customerName}</h3>}
        </div>
        {onBack && (
          <button
            onClick={onBack}
            className="px-4 py-2 bg-gray-500 text-white border-none rounded cursor-pointer hover:bg-gray-600 transition-colors"
          >
            ← 顧客選択に戻る
          </button>
        )}
      </div>

      {/* 月選択 */}
      <div className="mb-5">
        <label className="mr-2.5">対象月:</label>
        <input
          type="month"
          value={yyyymm}
          onChange={handleMonthChange}
          className="p-2 text-base border border-gray-300 rounded"
        />
        <button
          onClick={() => refetch()}
          className="ml-2.5 px-4 py-2 bg-blue-500 text-white border-none rounded cursor-pointer hover:bg-blue-600 transition-colors"
        >
          更新
        </button>
      </div>

      {/* ローディング */}
      {isLoading && <p className="text-gray-600">読み込み中...</p>}

      {/* エラー */}
      {error ? (
        <div className="p-2.5 bg-red-100 text-red-800 border border-red-300 rounded">
          エラーが発生しました
        </div>
      ) : null}

      {/* データ表示 */}
      {data && (
        <div>
          {/* 日別詳細 */}
          <div className="mb-8">
            <h4 className="text-lg font-semibold mb-3">作業詳細</h4>
            <table className="w-full border-collapse border border-gray-300">
              <thead>
                <tr className="bg-gray-50">
                  <th className="p-2.5 text-left border-b-2 border-gray-300">日付</th>
                  <th className="p-2.5 text-left border-b-2 border-gray-300">概要</th>
                  <th className="p-2.5 text-right border-b-2 border-gray-300">工数</th>
                </tr>
              </thead>
              <tbody>
                {data.rows && data.rows.length > 0 ? (
                  data.rows.map((row, index) => (
                    <tr key={index}>
                      <td className="p-2.5 border-b border-gray-300">{row.date}</td>
                      <td className="p-2.5 border-b border-gray-300">{row.summary || "-"}</td>
                      <td className="p-2.5 text-right border-b border-gray-300 font-bold">
                        {row.hours?.toFixed(2)}h
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={3} className="p-5 text-center text-gray-500">
                      データがありません
                    </td>
                  </tr>
                )}
              </tbody>
              {/* 合計行 */}
              <tfoot>
                <tr className="bg-gray-50">
                  <td colSpan={2} className="p-2.5 text-right font-bold border-t-2 border-gray-300">
                    合計
                  </td>
                  <td className="p-2.5 text-right font-bold text-lg border-t-2 border-gray-300 text-blue-500">
                    {data.total_hours.toFixed(2)}h
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* 金額表示 */}
          <div className="p-5 bg-blue-50 rounded-lg border border-blue-500">
            <div>
              <h3 className="m-0 text-blue-500 text-xl font-bold">請求予定額</h3>
              <p className="text-3xl font-bold my-2.5 text-gray-800">
                ¥{data.total_amount_jpy.toLocaleString()}
              </p>
            </div>

            <div className="mt-4 text-sm text-gray-600 border-t border-gray-300 pt-4">
              <p className="mb-1">総工数: {data.total_hours.toFixed(2)}時間</p>
              <p className="mb-1">工賃: ¥{data.labor_cost_jpy.toLocaleString()}</p>
              <p className="mb-1">製品金額: ¥{data.product_amount_jpy.toLocaleString()}</p>
              <p>資材金額: ¥{data.material_amount_jpy.toLocaleString()}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
