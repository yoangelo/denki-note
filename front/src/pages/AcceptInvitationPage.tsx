import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { httpClient } from "../api/mutator";
import { useAuthStore } from "../stores/authStore";
import type { User } from "../stores/authStore";

interface AcceptInvitationResponse {
  message: string;
  user: User;
}

export function AcceptInvitationPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const setUser = useAuthStore((state) => state.setUser);

  const invitationToken = searchParams.get("invitation_token");

  useEffect(() => {
    if (!invitationToken) {
      setError("招待トークンが無効です");
    }
  }, [invitationToken]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password !== passwordConfirmation) {
      setError("パスワードが一致しません");
      return;
    }

    if (password.length < 8) {
      setError("パスワードは8文字以上で入力してください");
      return;
    }

    if (!invitationToken) {
      setError("招待トークンが無効です");
      return;
    }

    setIsLoading(true);

    try {
      const response = await httpClient<AcceptInvitationResponse>({
        url: "/auth/invitation",
        method: "PUT",
        data: {
          user: {
            invitation_token: invitationToken,
            password,
            password_confirmation: passwordConfirmation,
          },
        },
      });

      setUser(response.user);
      navigate("/daily");
    } catch (err: any) {
      const errorMessage =
        err?.response?.data?.errors?.[0] ||
        "招待の承認に失敗しました。トークンが無効または期限切れの可能性があります。";
      setError(errorMessage);
      console.error("Accept invitation error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">招待を承認</h1>
          <p className="text-gray-600">パスワードを設定してアカウントを有効化してください</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
              パスワード（8文字以上）
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="パスワード"
            />
          </div>

          <div>
            <label htmlFor="passwordConfirmation" className="block text-sm font-medium text-gray-700 mb-2">
              パスワード（確認）
            </label>
            <input
              type="password"
              id="passwordConfirmation"
              value={passwordConfirmation}
              onChange={(e) => setPasswordConfirmation(e.target.value)}
              required
              minLength={8}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="パスワード（確認）"
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading || !invitationToken}
            className="w-full bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? "処理中..." : "パスワードを設定してログイン"}
          </button>
        </form>
      </div>
    </div>
  );
}
