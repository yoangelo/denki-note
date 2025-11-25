import { useState } from "react";
import { httpClient } from "../api/mutator";
import { useAuthStore } from "../stores/authStore";
import type { User } from "../stores/authStore";
import { Button, Input, Alert, Card } from "../components/ui";
import { Modal } from "../components/ui/Modal";

interface LoginResponse {
  user: User;
}

export function LoginPage() {
  const [email, setEmail] = useState("admin@example.com");
  const [password, setPassword] = useState("Password123!");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [healthModalOpen, setHealthModalOpen] = useState(false);
  const [healthMessage, setHealthMessage] = useState("");
  const setUser = useAuthStore((state) => state.setUser);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const response = await httpClient<LoginResponse>({
        url: "/auth/login",
        method: "POST",
        data: {
          user: {
            email,
            password,
          },
        },
      });
      setUser(response.user);
    } catch (err) {
      setError("ログインに失敗しました。メールアドレスとパスワードを確認してください。");
      console.error("Login error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  // healthチェックボタンのハンドラ
  const handleHealthCheck = async () => {
    try {
      const res = await httpClient<{ message: string }>({
        url: "/health",
        method: "GET",
      });
      setHealthMessage(res.message || "No message");
    } catch (err) {
      setHealthMessage(
        "ヘルスチェック失敗: " + (err instanceof Error ? err.message : "不明なエラー")
      );
    }
    setHealthModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">日報管理システム</h1>
          <p className="text-gray-600">ログインしてください</p>
        </div>

        <Card>
          <form onSubmit={handleLogin} className="space-y-6">
            <Input
              type="email"
              id="email"
              label="メールアドレス"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="email@example.com"
              fullWidth
            />

            <Input
              type="password"
              id="password"
              label="パスワード"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="パスワード"
              fullWidth
            />

            {error && <Alert variant="error">{error}</Alert>}

            <Button type="submit" disabled={isLoading} fullWidth size="lg">
              {isLoading ? "ログイン中..." : "ログイン"}
            </Button>
          </form>

          <div className="mt-6 pt-6 border-t border-gray-200">
            <p className="text-sm text-gray-600 mb-2">開発環境のログイン情報:</p>
            <ul className="text-xs text-gray-500 space-y-1">
              <li>管理者: admin@example.com / Password123!</li>
              <li>メンバー: test1@example.com / Password123!</li>
            </ul>
          </div>

          {/* healthチェックボタン追加 */}
          <div className="mt-6">
            <Button variant="secondary" onClick={handleHealthCheck} fullWidth>
              Healthチェック
            </Button>
          </div>

          {/* healthチェック結果モーダル */}
          <Modal
            isOpen={healthModalOpen}
            onClose={() => setHealthModalOpen(false)}
            title="Healthチェック結果"
            size="sm"
          >
            <p className="text-gray-700 text-center py-4">{healthMessage}</p>
            <div className="flex justify-center mt-4">
              <Button variant="primary" onClick={() => setHealthModalOpen(false)}>
                閉じる
              </Button>
            </div>
          </Modal>
        </Card>
      </div>
    </div>
  );
}
