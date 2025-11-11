import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { httpClient } from "../../api/mutator";
import type { User } from "../../stores/authStore";
import {
  Button,
  Input,
  Select,
  Badge,
  Alert,
  PageHeader,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  TableEmptyState,
} from "../../components/ui";

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
      <PageHeader
        title="ユーザー管理"
        action={
          <Link to="/admin/users/invite" className="no-underline">
            <Button>ユーザーを招待</Button>
          </Link>
        }
      />

      <form onSubmit={handleSearch} className="mb-6 flex gap-3">
        <Input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="名前またはメールアドレスで検索"
          className="w-80"
        />
        <Select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value as "all" | "admin" | "member")}
          className="w-48"
        >
          <option value="all">すべてのロール</option>
          <option value="admin">管理者</option>
          <option value="member">メンバー</option>
        </Select>
        <Button type="submit" variant="secondary">
          検索
        </Button>
      </form>

      {error && (
        <Alert variant="error" className="mb-6">
          {error}
        </Alert>
      )}

      {loading ? (
        <div className="text-center py-12 text-gray-500">読み込み中...</div>
      ) : (
        <Table>
          <TableHeader>
            <TableHead>表示名</TableHead>
            <TableHead>メールアドレス</TableHead>
            <TableHead>ロール</TableHead>
            <TableHead>ステータス</TableHead>
            <TableHead>登録日</TableHead>
            <TableHead align="center">操作</TableHead>
          </TableHeader>
          <TableBody>
            {users.length === 0 ? (
              <TableEmptyState message="ユーザーが見つかりませんでした" colSpan={6} />
            ) : (
              users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>{user.display_name}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {user.roles.map((role) => (
                        <Badge key={role} variant={role === "admin" ? "info" : "primary"} size="sm">
                          {role === "admin" ? "管理者" : "メンバー"}
                        </Badge>
                      ))}
                      {user.roles.length === 0 && (
                        <span className="text-gray-400 text-sm">ロールなし</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={user.is_active ? "success" : "gray"} size="sm">
                      {user.is_active ? "有効" : "無効"}
                    </Badge>
                  </TableCell>
                  <TableCell>{new Date(user.created_at).toLocaleDateString("ja-JP")}</TableCell>
                  <TableCell align="center">
                    <Link
                      to={`/admin/users/${user.id}`}
                      className="text-blue-600 hover:text-blue-800 no-underline font-medium"
                    >
                      詳細
                    </Link>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
