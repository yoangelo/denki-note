import { useEffect, useState } from "react";

type HealthResponse = {
  status: string;
  time: string;
  message: string;
};

function App() {
  const [data, setData] = useState<HealthResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchHealth = async () => {
      try {
        const res = await fetch(`${import.meta.env.VITE_API_ORIGIN}/health`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        setData(json);
      } catch (e: any) {
        setError(e.message);
      }
    };
    fetchHealth();
  }, []);

  return (
    <div style={{ fontFamily: "sans-serif", padding: "1rem" }}>
      <h1>フロント⇔バック 接続テスト</h1>
      {error && <p style={{ color: "red" }}>エラー: {error}</p>}
      {data ? (
        <div>
          <p>✅ API通信成功</p>
          <pre>{JSON.stringify(data, null, 2)}</pre>
        </div>
      ) : (
        !error && <p>読み込み中...</p>
      )}
    </div>
  );
}

export default App;