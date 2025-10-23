import { useBulkCreateWorkEntries } from "@/api/generated/work-entries/work-entries";

interface WorkEntry {
  client_entry_id: string;
  daily_report_id: string;
  user_id: string;
  summary: string;
  minutes: number;
}

interface BulkSaveProps {
  entries: WorkEntry[];
  onSuccess?: () => void;
}

export function BulkSave({ entries, onSuccess }: BulkSaveProps) {
  const bulkCreate = useBulkCreateWorkEntries({
    mutation: {
      onSuccess: (data) => {
        console.log(`保存成功: ${data.accepted}件`);
        if (data.failed && data.failed.length > 0) {
          console.warn("失敗したエントリ:", data.failed);
        }
        onSuccess?.();
      },
      onError: (error) => {
        console.error("保存エラー:", error);
      },
    },
  });

  const handleSave = () => {
    if (entries.length === 0) {
      alert("保存するデータがありません");
      return;
    }

    // クライアントバッチIDを生成（タイムスタンプベース）
    const clientBatchId = `batch_${Date.now()}_${Math.random().toString(36).substring(7)}`;

    bulkCreate.mutate({
      data: {
        client_batch_id: clientBatchId,
        entries: entries,
      },
    });
  };

  return (
    <div style={{ padding: "20px" }}>
      <h3>作業エントリのバルク保存</h3>
      
      <div style={{ marginBottom: "15px" }}>
        <p>保存待ちエントリ数: {entries.length}件</p>
      </div>

      <button
        onClick={handleSave}
        disabled={bulkCreate.isPending || entries.length === 0}
        style={{
          padding: "12px 24px",
          fontSize: "16px",
          backgroundColor: bulkCreate.isPending ? "#6c757d" : "#007bff",
          color: "white",
          border: "none",
          borderRadius: "4px",
          cursor: bulkCreate.isPending || entries.length === 0 ? "not-allowed" : "pointer",
          opacity: bulkCreate.isPending || entries.length === 0 ? 0.7 : 1,
        }}
      >
        {bulkCreate.isPending ? "保存中..." : "まとめて保存"}
      </button>

      {/* 成功メッセージ */}
      {bulkCreate.isSuccess && bulkCreate.data && (
        <div style={{
          marginTop: "15px",
          padding: "10px",
          backgroundColor: "#d4edda",
          color: "#155724",
          border: "1px solid #c3e6cb",
          borderRadius: "4px",
        }}>
          ✅ 保存完了: {bulkCreate.data.accepted}件成功
          {bulkCreate.data.failed && bulkCreate.data.failed.length > 0 && (
            <div style={{ marginTop: "10px", color: "#721c24" }}>
              ⚠️ 失敗: {bulkCreate.data.failed.length}件
              <ul>
                {bulkCreate.data.failed.map((f, idx) => (
                  <li key={idx}>
                    ID: {f.client_entry_id} - {f.reason}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* エラーメッセージ */}
      {bulkCreate.isError && (
        <div style={{
          marginTop: "15px",
          padding: "10px",
          backgroundColor: "#f8d7da",
          color: "#721c24",
          border: "1px solid #f5c6cb",
          borderRadius: "4px",
        }}>
          ❌ エラー: {(bulkCreate.error as Error).message}
        </div>
      )}

      {/* オフライン対応のヒント */}
      <div style={{
        marginTop: "20px",
        padding: "15px",
        backgroundColor: "#fff3cd",
        color: "#856404",
        border: "1px solid #ffeaa7",
        borderRadius: "4px",
        fontSize: "14px",
      }}>
        💡 ヒント: オフライン時はローカルストレージに保存され、オンライン復帰時に自動同期されます（今後実装予定）
      </div>
    </div>
  );
}