import { useEffect } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useHealthCheck } from "./api/generated/health/health";

const qc = new QueryClient();

function Health() {
  const { data, error, isLoading } = useHealthCheck();

  useEffect(() => {
    // 任意：サンプルログ
    if (data) console.log("health", data);
  }, [data]);

  if (isLoading) return <p>読み込み中...</p>;
  if (error) return <p style={{ color: "red" }}>エラー: {(error as Error)?.message}</p>;

  return (
    <div>
      <p>✅ orval 生成フックでAPI通信成功</p>
      <pre>{JSON.stringify(data, null, 2)}</pre>
    </div>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={qc}>
      <div style={{ fontFamily: "sans-serif", padding: 16 }}>
        <h1>OpenAPI → 型/フック生成テスト</h1>
        <Health />
      </div>
    </QueryClientProvider>
  );
}
