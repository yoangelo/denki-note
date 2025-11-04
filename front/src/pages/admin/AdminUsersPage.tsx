import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { httpClient } from "../../api/mutator";
import type { User } from "../../stores/authStore";

interface UsersResponse {
  users: User[];
  meta: {
    total_count: number;
    returned_count: number;
  };
}

export function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<"all" | "admin" | "member">("all");

  useEffect(() => {
    fetchUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roleFilter]);

  const fetchUsers = async () => {
    setLoading(true);
    setError("");
    try {
      const params: Record<string, string> = {};
      if (query) params.query = query;
      if (roleFilter !== "all") params.role = roleFilter;

      const response = await httpClient<UsersResponse>({
        url: "/admin/users",
        params,
      });
      setUsers(response.users);
    } catch (err) {
      setError("ユーザー一覧の取得に失敗しました");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchUsers();
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">ユーザー管理</h2>
        <Link
          to="/admin/users/invite"
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors no-underline"
        >
          ユーザーを招待
        </Link>
      </div>

      <form onSubmit={handleSearch} className="mb-6 flex gap-4">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="名前またはメールアドレスで検索"
          className="flex-1 px-4 py-2 border border-gray-300 rounded"
        />
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value as "all" | "admin" | "member")}
          className="px-4 py-2 border border-gray-300 rounded"
        >
          <option value="all">すべてのロール</option>
          <option value="admin">管理者</option>
          <option value="member">メンバー</option>
        </select>
        <button
          type="submit"
          className="px-6 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded transition-colors"
        >
          検索
        </button>
      </form>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded">{error}</div>
      )}

      {loading ? (
        <div className="text-center py-8">読み込み中...</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse bg-white shadow rounded">
            <thead>
              <tr className="bg-gray-100">
                <th className="border border-gray-300 px-4 py-2 text-left">表示名</th>
                <th className="border border-gray-300 px-4 py-2 text-left">メールアドレス</th>
                <th className="border border-gray-300 px-4 py-2 text-left">ロール</th>
                <th className="border border-gray-300 px-4 py-2 text-left">ステータス</th>
                <th className="border border-gray-300 px-4 py-2 text-left">登録日</th>
                <th className="border border-gray-300 px-4 py-2 text-center">操作</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="border border-gray-300 px-4 py-2">{user.display_name}</td>
                  <td className="border border-gray-300 px-4 py-2">{user.email}</td>
                  <td className="border border-gray-300 px-4 py-2">
                    {user.roles.map((role) => (
                      <span
                        key={role}
                        className={`inline-block px-2 py-1 text-xs rounded mr-1 ${
                          role === "admin"
                            ? "bg-purple-100 text-purple-800"
                            : "bg-blue-100 text-blue-800"
                        }`}
                      >
                        {role === "admin" ? "管理者" : "メンバー"}
                      </span>
                    ))}
                    {user.roles.length === 0 && (
                      <span className="text-gray-400 text-sm">ロールなし</span>
                    )}
                  </td>
                  <td className="border border-gray-300 px-4 py-2">
                    <span
                      className={`inline-block px-2 py-1 text-xs rounded ${
                        user.is_active ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {user.is_active ? "有効" : "無効"}
                    </span>
                  </td>
                  <td className="border border-gray-300 px-4 py-2">
                    {new Date(user.created_at).toLocaleDateString("ja-JP")}
                  </td>
                  <td className="border border-gray-300 px-4 py-2 text-center">
                    <Link
                      to={`/admin/users/${user.id}`}
                      className="text-blue-600 hover:text-blue-800 no-underline"
                    >
                      詳細
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {users.length === 0 && (
            <div className="text-center py-8 text-gray-500">ユーザーが見つかりませんでした</div>
          )}
        </div>
      )}
    </div>
  );
}
