import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { httpClient } from "../../api/mutator";
import { Button, Input, Alert, Card } from "../../components/ui";

export function AdminUserInvitePage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await httpClient({
        url: "/auth/invitation",
        method: "POST",
        data: {
          user: {
            email,
            display_name: displayName,
          },
        },
      });

      setSuccess(true);
      setTimeout(() => {
        navigate("/admin/users");
      }, 2000);
    } catch (err) {
      setError("招待の送信に失敗しました。メールアドレスを確認してください。");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="max-w-2xl mx-auto">
        <Alert variant="success" title="招待メール送信完了">
          招待メールを送信しました。ユーザー一覧画面に戻ります...
        </Alert>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center gap-4 mb-8">
        <Link
          to="/admin/users"
          className="text-blue-600 hover:text-blue-800 no-underline font-medium"
        >
          ← ユーザー一覧に戻る
        </Link>
        <h2 className="text-3xl font-bold m-0">ユーザーを招待</h2>
      </div>

      <Alert variant="info" className="mb-6">
        招待されたユーザーには、アカウント設定用のリンクが記載されたメールが送信されます。
      </Alert>

      <Card>
        <form onSubmit={handleSubmit} className="space-y-6">
          <Input
            type="email"
            id="email"
            label="メールアドレス"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            placeholder="user@example.com"
            fullWidth
          />

          <Input
            type="text"
            id="displayName"
            label="表示名"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            required
            placeholder="山田 太郎"
            fullWidth
          />

          <div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={isAdmin}
                onChange={(e) => setIsAdmin(e.target.checked)}
                className="w-4 h-4"
              />
              <span className="text-sm text-gray-700">
                管理者権限を付与する（招待後にも変更可能）
              </span>
            </label>
            <p className="mt-2 text-xs text-gray-500">
              ※現在、ロール機能は実装中のため、招待後にユーザー詳細画面で設定してください
            </p>
          </div>

          {error && <Alert variant="error">{error}</Alert>}

          <div className="flex gap-3">
            <Button type="submit" disabled={loading}>
              {loading ? "送信中..." : "招待を送信"}
            </Button>
            <Link to="/admin/users" className="no-underline">
              <Button type="button" variant="secondary">
                キャンセル
              </Button>
            </Link>
          </div>
        </form>
      </Card>
    </div>
  );
}
