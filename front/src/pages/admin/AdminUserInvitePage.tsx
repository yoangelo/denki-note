import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { httpClient } from "../../api/mutator";

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
        <div className="bg-green-50 border border-green-200 text-green-700 px-6 py-4 rounded mb-6">
          招待メールを送信しました。ユーザー一覧画面に戻ります...
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center gap-4 mb-6">
        <Link to="/admin/users" className="text-blue-600 hover:text-blue-800 no-underline">
          ← ユーザー一覧に戻る
        </Link>
        <h2 className="text-2xl font-bold m-0">ユーザーを招待</h2>
      </div>

      <div className="bg-blue-50 border border-blue-200 text-blue-700 px-6 py-4 rounded mb-6">
        <p className="m-0">
          招待されたユーザーには、アカウント設定用のリンクが記載されたメールが送信されます。
        </p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white shadow rounded p-6">
        <div className="mb-6">
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
            メールアドレス <span className="text-red-500">*</span>
          </label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="user@example.com"
          />
        </div>

        <div className="mb-6">
          <label htmlFor="displayName" className="block text-sm font-medium text-gray-700 mb-2">
            表示名 <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="displayName"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            required
            className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="山田 太郎"
          />
        </div>

        <div className="mb-6">
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

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded">
            {error}
          </div>
        )}

        <div className="flex gap-4">
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {loading ? "送信中..." : "招待を送信"}
          </button>
          <Link
            to="/admin/users"
            className="px-6 py-2 bg-gray-300 hover:bg-gray-400 text-gray-800 rounded transition-colors no-underline inline-block"
          >
            キャンセル
          </Link>
        </div>
      </form>
    </div>
  );
}
