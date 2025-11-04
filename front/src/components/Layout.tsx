import { Outlet, Link, useLocation } from "react-router-dom";
import { useAuthStore } from "../stores/authStore";
import { httpClient } from "../api/mutator";

export function Layout() {
  const { user, logout } = useAuthStore();
  const location = useLocation();

  const handleLogout = async () => {
    try {
      await httpClient({
        url: "/auth/logout",
        method: "DELETE",
      });
    } catch (err) {
      console.error("Logout error:", err);
    } finally {
      logout();
    }
  };

  const isActive = (path: string) => {
    return location.pathname === path || location.pathname.startsWith(path + "/");
  };

  return (
    <div className="font-sans min-h-screen bg-gray-100">
      <header className="bg-gray-800 text-white p-5 mb-5">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="m-0 text-3xl font-bold">日報管理システム</h1>
            <p className="mt-2.5 opacity-80">工数記録から請求予定額までをワンストップで管理</p>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm opacity-80">
              {user?.display_name} ({user?.is_admin ? "管理者" : "メンバー"})
            </span>
            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded transition-colors"
            >
              ログアウト
            </button>
          </div>
        </div>
      </header>

      <div className="px-5 pb-5 flex gap-2.5 border-b-2 border-gray-300">
        <Link
          to="/daily"
          className={`px-5 py-2.5 text-white border-none rounded-t cursor-pointer text-base transition-colors no-underline ${
            isActive("/daily") ? "bg-blue-500" : "bg-gray-500 hover:bg-gray-600"
          }`}
        >
          日報入力
        </Link>
        <Link
          to="/list"
          className={`px-5 py-2.5 text-white border-none rounded-t cursor-pointer text-base transition-colors no-underline ${
            isActive("/list") ? "bg-blue-500" : "bg-gray-500 hover:bg-gray-600"
          }`}
        >
          日報一覧
        </Link>
        <Link
          to="/summary"
          className={`px-5 py-2.5 text-white border-none rounded-t cursor-pointer text-base transition-colors no-underline ${
            isActive("/summary") ? "bg-blue-500" : "bg-gray-500 hover:bg-gray-600"
          }`}
        >
          月次集計
        </Link>

        {user?.is_admin && (
          <Link
            to="/admin/users"
            className={`px-5 py-2.5 text-white border-none rounded-t cursor-pointer text-base transition-colors no-underline ${
              isActive("/admin") ? "bg-green-600" : "bg-green-700 hover:bg-green-800"
            }`}
          >
            ユーザー管理
          </Link>
        )}
      </div>

      <main className="p-5 bg-white m-5 rounded-lg">
        <Outlet />
      </main>

      <footer className="mt-10 p-5 bg-gray-50 text-center border-t border-gray-300">
        {/* フッターコンテンツ */}
      </footer>
    </div>
  );
}
