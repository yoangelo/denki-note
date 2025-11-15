import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import toast from "react-hot-toast";
import { httpClient } from "../../api/mutator";
import type { User } from "../../stores/authStore";
import { ConfirmModal } from "../../components/ui";

interface UserDetailResponse {
  user: User;
}

export function AdminUserDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [saving, setSaving] = useState(false);
  const [roleLoading, setRoleLoading] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  useEffect(() => {
    if (id) {
      fetchUser();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const fetchUser = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await httpClient<UserDetailResponse>({
        url: `/admin/users/${id}`,
      });
      setUser(response.user);
      setDisplayName(response.user.display_name);
      setIsActive(response.user.is_active);
    } catch (err) {
      setError("ユーザー情報の取得に失敗しました");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");

    try {
      const response = await httpClient<UserDetailResponse>({
        url: `/admin/users/${id}`,
        method: "PUT",
        data: {
          user: {
            display_name: displayName,
            is_active: isActive,
          },
        },
      });
      setUser(response.user);
      alert("ユーザー情報を更新しました");
    } catch (err) {
      setError("更新に失敗しました");
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleAddRole = async (roleName: "admin" | "member") => {
    if (!user) return;
    if (user.roles.includes(roleName)) {
      alert("既にこのロールが付与されています");
      return;
    }

    setRoleLoading(true);
    setError("");

    try {
      const response = await httpClient<UserDetailResponse>({
        url: `/admin/users/${id}/add_role`,
        method: "POST",
        data: {
          role_name: roleName,
        },
      });
      setUser(response.user);
      alert(`${roleName === "admin" ? "管理者" : "メンバー"}ロールを付与しました`);
    } catch (err) {
      setError("ロールの付与に失敗しました");
      console.error(err);
    } finally {
      setRoleLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      await httpClient({
        url: `/admin/users/${id}`,
        method: "DELETE",
      });
      toast.success("ユーザーを削除しました");
      navigate("/admin/users");
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message || "削除に失敗しました");
        toast.error(err.message || "削除に失敗しました");
      } else {
        setError("削除に失敗しました");
        toast.error("削除に失敗しました");
      }
      console.error(err);
    } finally {
      setShowDeleteModal(false);
    }
  };

  if (loading) {
    return <div className="text-center py-8">読み込み中...</div>;
  }

  if (!user) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded">
          ユーザーが見つかりませんでした
        </div>
        <Link to="/admin/users" className="mt-4 inline-block text-blue-600 hover:text-blue-800">
          ← ユーザー一覧に戻る
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center gap-4 mb-6">
        <Link to="/admin/users" className="text-blue-600 hover:text-blue-800 no-underline">
          ← ユーザー一覧に戻る
        </Link>
        <h2 className="text-2xl font-bold m-0">ユーザー詳細</h2>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded">{error}</div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white shadow rounded p-6">
          <h3 className="text-lg font-semibold mb-4">基本情報</h3>

          <form onSubmit={handleUpdate}>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">メールアドレス</label>
              <div className="px-4 py-2 bg-gray-100 rounded">{user.email}</div>
              <p className="mt-1 text-xs text-gray-500">※メールアドレスは変更できません</p>
            </div>

            <div className="mb-4">
              <label htmlFor="displayName" className="block text-sm font-medium text-gray-700 mb-2">
                表示名
              </label>
              <input
                type="text"
                id="displayName"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="mb-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="w-4 h-4"
                />
                <span className="text-sm text-gray-700">アカウントを有効にする</span>
              </label>
            </div>

            <button
              type="submit"
              disabled={saving}
              className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {saving ? "保存中..." : "変更を保存"}
            </button>
          </form>
        </div>

        <div className="bg-white shadow rounded p-6">
          <h3 className="text-lg font-semibold mb-4">ロール管理</h3>

          <div className="mb-4">
            <p className="text-sm text-gray-600 mb-2">現在のロール:</p>
            <div className="flex flex-wrap gap-2">
              {user.roles.map((role) => (
                <span
                  key={role}
                  className={`inline-block px-3 py-1 text-sm rounded ${
                    role === "admin" ? "bg-purple-100 text-purple-800" : "bg-blue-100 text-blue-800"
                  }`}
                >
                  {role === "admin" ? "管理者" : "メンバー"}
                </span>
              ))}
              {user.roles.length === 0 && (
                <span className="text-gray-400 text-sm">ロールが設定されていません</span>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <button
              onClick={() => handleAddRole("admin")}
              disabled={roleLoading || user.roles.includes("admin")}
              className="w-full px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {user.roles.includes("admin") ? "管理者ロール付与済み" : "管理者ロールを付与"}
            </button>
            <button
              onClick={() => handleAddRole("member")}
              disabled={roleLoading || user.roles.includes("member")}
              className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {user.roles.includes("member") ? "メンバーロール付与済み" : "メンバーロールを付与"}
            </button>
          </div>

          <div className="mt-6 pt-6 border-t border-gray-200">
            <h4 className="text-sm font-semibold mb-2 text-red-700">危険な操作</h4>
            <button
              onClick={() => setShowDeleteModal(true)}
              className="w-full px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded transition-colors"
            >
              このユーザーを削除
            </button>
          </div>
        </div>
      </div>

      <div className="mt-6 bg-gray-50 shadow rounded p-6">
        <h3 className="text-lg font-semibold mb-4">詳細情報</h3>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-gray-600">ユーザーID:</p>
            <p className="font-mono text-xs">{user.id}</p>
          </div>
          <div>
            <p className="text-gray-600">テナントID:</p>
            <p className="font-mono text-xs">{user.tenant_id}</p>
          </div>
          <div>
            <p className="text-gray-600">登録日:</p>
            <p>{new Date(user.created_at).toLocaleString("ja-JP")}</p>
          </div>
          <div>
            <p className="text-gray-600">ステータス:</p>
            <p>
              <span
                className={`inline-block px-2 py-1 text-xs rounded ${
                  user.is_active ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"
                }`}
              >
                {user.is_active ? "有効" : "無効"}
              </span>
            </p>
          </div>
        </div>
      </div>

      {/* 削除確認モーダル */}
      <ConfirmModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDelete}
        title="ユーザーの削除"
        message={`本当に「${user?.display_name}」を削除しますか？\n\nこの操作は取り消せません。`}
        confirmText="削除する"
        variant="danger"
      />
    </div>
  );
}
