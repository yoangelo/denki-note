import { useState } from "react";
import { useListUsers } from "@/api/generated/users/users";

type WorkerSelectProps = {
  selectedWorkers: string[];
  onWorkersChange: (workers: string[]) => void;
};

export function WorkerSelect({ selectedWorkers, onWorkersChange }: WorkerSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { data, isLoading } = useListUsers({
    is_active: true,
  });

  // APIから返されるデータが配列であることを保証
  const users = Array.isArray(data) ? data : [];

  const handleToggleWorker = (workerId: string) => {
    if (selectedWorkers.includes(workerId)) {
      onWorkersChange(selectedWorkers.filter((id) => id !== workerId));
    } else {
      onWorkersChange([...selectedWorkers, workerId]);
    }
  };

  const handleSelectAll = () => {
    if (selectedWorkers.length === users.length) {
      onWorkersChange([]);
    } else {
      onWorkersChange(users.map((user) => user.id));
    }
  };

  const selectedUsers = users.filter((user) => selectedWorkers.includes(user.id));

  return (
    <div className="space-y-3">
      {/* 選択済み作業者表示 */}
      {selectedUsers.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {selectedUsers.map((user) => (
            <div
              key={user.id}
              className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-100 text-blue-800 rounded-full text-sm font-medium"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" />
              </svg>
              <span>{user.display_name}</span>
              <button
                type="button"
                onClick={() => handleToggleWorker(user.id)}
                className="ml-1 text-blue-600 hover:text-blue-800 font-bold"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-sm text-gray-500 italic">作業者を選択してください</div>
      )}

      {/* 作業者選択ボタン */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`px-4 py-2 rounded-lg border-2 font-medium transition-colors ${
          isOpen
            ? "border-blue-500 bg-blue-50 text-blue-600"
            : "border-gray-300 bg-white text-gray-700 hover:border-blue-400"
        }`}
      >
        <span className="flex items-center gap-2">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          {isOpen ? "閉じる" : "作業者を選択"}
        </span>
      </button>

      {/* 作業者選択パネル */}
      {isOpen && (
        <div className="border-2 border-blue-200 rounded-lg p-4 bg-blue-50/50">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <svg
                className="animate-spin h-8 w-8 text-blue-500"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                />
              </svg>
            </div>
          ) : users.length === 0 ? (
            <div className="text-center py-8 text-gray-500">作業者が登録されていません</div>
          ) : (
            <>
              {/* 全選択ボタン */}
              <div className="mb-3 pb-3 border-b border-blue-200">
                <button
                  type="button"
                  onClick={handleSelectAll}
                  className="text-sm font-medium text-blue-600 hover:text-blue-800"
                >
                  {selectedWorkers.length === users.length ? "全選択解除" : "全て選択"}
                </button>
              </div>

              {/* 作業者リスト */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                {users.map((user) => {
                  const isSelected = selectedWorkers.includes(user.id);
                  return (
                    <button
                      key={user.id}
                      type="button"
                      onClick={() => handleToggleWorker(user.id)}
                      className={`px-4 py-2.5 text-sm font-medium rounded-lg border-2 transition-all transform hover:scale-105 ${
                        isSelected
                          ? "bg-blue-500 text-white border-blue-500 shadow-md"
                          : "bg-white text-gray-700 border-gray-300 hover:border-blue-400 hover:bg-blue-50"
                      }`}
                    >
                      <div className="flex items-center justify-center gap-2">
                        {isSelected && (
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path
                              fillRule="evenodd"
                              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                              clipRule="evenodd"
                            />
                          </svg>
                        )}
                        <span>{user.display_name}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
