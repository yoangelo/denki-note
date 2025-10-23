import { useState } from "react";
import { useGetCustomerMonthSummary } from "@/api/generated/summaries/summaries";

interface CustomerMonthProps {
  customerId: string;
  customerName?: string;
}

export function CustomerMonth({ customerId, customerName }: CustomerMonthProps) {
  const today = new Date();
  const currentYearMonth = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
  
  const [yyyymm, setYyyymm] = useState(currentYearMonth);
  const [rateToggle, setRateToggle] = useState<"on" | "off">("on");

  const { data, isLoading, error, refetch } = useGetCustomerMonthSummary({
    customer_id: customerId,
    yyyymm: yyyymm,
    rate_toggle: rateToggle,
  });

  const handleMonthChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // YYYY-MM形式に変換
    if (value.match(/^\d{4}-\d{2}$/)) {
      setYyyymm(value);
    }
  };

  const handleRateToggle = () => {
    setRateToggle(prev => prev === "on" ? "off" : "on");
  };

  if (!customerId) {
    return <div>顧客を選択してください</div>;
  }

  return (
    <div style={{ padding: "20px", fontFamily: "sans-serif" }}>
      <h2>月次集計</h2>
      {customerName && <h3>顧客: {customerName}</h3>}
      
      {/* 月選択 */}
      <div style={{ marginBottom: "20px" }}>
        <label style={{ marginRight: "10px" }}>対象月:</label>
        <input
          type="month"
          value={yyyymm}
          onChange={handleMonthChange}
          style={{
            padding: "8px",
            fontSize: "16px",
            border: "1px solid #ccc",
            borderRadius: "4px",
          }}
        />
        <button
          onClick={() => refetch()}
          style={{
            marginLeft: "10px",
            padding: "8px 16px",
            backgroundColor: "#007bff",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
          }}
        >
          更新
        </button>
      </div>

      {/* ローディング */}
      {isLoading && <p>読み込み中...</p>}

      {/* エラー */}
      {error ? (
        <div style={{
          padding: "10px",
          backgroundColor: "#f8d7da",
          color: "#721c24",
          border: "1px solid #f5c6cb",
          borderRadius: "4px",
        }}>
          エラーが発生しました
        </div>
      ) : null}

      {/* データ表示 */}
      {data && (
        <div>
          {/* 日別詳細 */}
          <div style={{ marginBottom: "30px" }}>
            <h4>作業詳細</h4>
            <table style={{
              width: "100%",
              borderCollapse: "collapse",
              border: "1px solid #ddd",
            }}>
              <thead>
                <tr style={{ backgroundColor: "#f8f9fa" }}>
                  <th style={{ padding: "10px", textAlign: "left", borderBottom: "2px solid #dee2e6" }}>
                    日付
                  </th>
                  <th style={{ padding: "10px", textAlign: "left", borderBottom: "2px solid #dee2e6" }}>
                    概要
                  </th>
                  <th style={{ padding: "10px", textAlign: "right", borderBottom: "2px solid #dee2e6" }}>
                    工数
                  </th>
                </tr>
              </thead>
              <tbody>
                {data.rows && data.rows.length > 0 ? (
                  data.rows.map((row, index) => (
                    <tr key={index}>
                      <td style={{ padding: "10px", borderBottom: "1px solid #dee2e6" }}>
                        {row.date}
                      </td>
                      <td style={{ padding: "10px", borderBottom: "1px solid #dee2e6" }}>
                        {row.summary || "-"}
                      </td>
                      <td style={{ 
                        padding: "10px", 
                        textAlign: "right", 
                        borderBottom: "1px solid #dee2e6",
                        fontWeight: "bold",
                      }}>
                        {row.hours?.toFixed(2)}h
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={3} style={{ padding: "20px", textAlign: "center", color: "#6c757d" }}>
                      データがありません
                    </td>
                  </tr>
                )}
              </tbody>
              {/* 合計行 */}
              <tfoot>
                <tr style={{ backgroundColor: "#f8f9fa" }}>
                  <td colSpan={2} style={{ 
                    padding: "10px", 
                    textAlign: "right", 
                    fontWeight: "bold",
                    borderTop: "2px solid #dee2e6",
                  }}>
                    合計
                  </td>
                  <td style={{ 
                    padding: "10px", 
                    textAlign: "right", 
                    fontWeight: "bold",
                    fontSize: "18px",
                    borderTop: "2px solid #dee2e6",
                    color: "#007bff",
                  }}>
                    {data.total_hours.toFixed(2)}h
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* 金額表示 */}
          <div style={{
            padding: "20px",
            backgroundColor: "#e7f3ff",
            borderRadius: "8px",
            border: "1px solid #007bff",
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <h3 style={{ margin: 0, color: "#007bff" }}>請求予定額</h3>
                <p style={{ 
                  fontSize: "32px", 
                  fontWeight: "bold", 
                  margin: "10px 0",
                  color: "#333",
                }}>
                  ¥{data.amount_jpy.toLocaleString()}
                </p>
              </div>
              
              {/* 掛率トグル */}
              <div>
                <label style={{ 
                  display: "flex", 
                  alignItems: "center", 
                  cursor: "pointer",
                  padding: "10px",
                  backgroundColor: "white",
                  borderRadius: "4px",
                  border: "1px solid #ccc",
                }}>
                  <input
                    type="checkbox"
                    checked={rateToggle === "on"}
                    onChange={handleRateToggle}
                    style={{ marginRight: "8px", transform: "scale(1.2)" }}
                  />
                  <span>得意先掛率を適用</span>
                </label>
              </div>
            </div>

            <div style={{ 
              marginTop: "15px", 
              fontSize: "14px", 
              color: "#666",
              borderTop: "1px solid #ccc",
              paddingTop: "15px",
            }}>
              <p>総工数: {data.total_hours.toFixed(2)}時間</p>
              <p>掛率: {rateToggle === "on" ? "適用中" : "適用なし（100%）"}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}