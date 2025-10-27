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
    <div className="p-5">
      <h3 className="text-lg font-semibold mb-4">作業エントリのバルク保存</h3>

      <div className="mb-4">
        <p className="text-gray-700">保存待ちエントリ数: {entries.length}件</p>
      </div>

      <button
        onClick={handleSave}
        disabled={bulkCreate.isPending || entries.length === 0}
        className={`px-6 py-3 text-base text-white border-none rounded transition-all ${
          bulkCreate.isPending || entries.length === 0
            ? "bg-gray-500 cursor-not-allowed opacity-70"
            : "bg-blue-500 cursor-pointer hover:bg-blue-600"
        }`}
      >
        {bulkCreate.isPending ? "保存中..." : "まとめて保存"}
      </button>

      {/* 成功メッセージ */}
      {bulkCreate.isSuccess && bulkCreate.data && (
        <div className="mt-4 p-2.5 bg-green-100 text-green-800 border border-green-300 rounded">
          ✅ 保存完了: {bulkCreate.data.accepted}件成功
          {bulkCreate.data.failed && bulkCreate.data.failed.length > 0 && (
            <div className="mt-2.5 text-red-800">
              ⚠️ 失敗: {bulkCreate.data.failed.length}件
              <ul className="pl-5 mt-2">
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
        <div className="mt-4 p-2.5 bg-red-100 text-red-800 border border-red-300 rounded">
          ❌ エラー: {(bulkCreate.error as Error).message}
        </div>
      )}

      {/* オフライン対応のヒント */}
      <div className="mt-5 p-4 bg-yellow-50 text-yellow-800 border border-yellow-300 rounded text-sm">
        💡 ヒント:
        オフライン時はローカルストレージに保存され、オンライン復帰時に自動同期されます（今後実装予定）
      </div>
    </div>
  );
}
