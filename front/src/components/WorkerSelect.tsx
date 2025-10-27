import { useState, useEffect } from "react";
import { useListUsers } from "@/api/generated/users/users";

interface WorkerSelectProps {
  selectedWorkers: string[];
  onWorkersChange: (workers: string[]) => void;
}

export function WorkerSelect({ selectedWorkers, onWorkersChange }: WorkerSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { data: users = [], isLoading } = useListUsers({
    query: { is_active: true },
  });

  const handleToggleWorker = (workerId: string) => {
    if (selectedWorkers.includes(workerId)) {
      onWorkersChange(selectedWorkers.filter((id) => id !== workerId));
    } else {
      onWorkersChange([...selectedWorkers, workerId]);
    }
  };

  const selectedUsers = users.filter((user) => selectedWorkers.includes(user.id));

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium">作業者</label>
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="text-sm text-blue-600 hover:text-blue-800"
        >
          {isOpen ? "閉じる" : "作業者を追加"}
        </button>
      </div>

      {selectedUsers.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selectedUsers.map((user) => (
            <div
              key={user.id}
              className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
            >
              <span>{user.display_name}</span>
              <button
                type="button"
                onClick={() => handleToggleWorker(user.id)}
                className="text-blue-600 hover:text-blue-800"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}

      {isOpen && (
        <div className="border border-gray-200 rounded-lg p-3 bg-gray-50">
          {isLoading ? (
            <div className="text-sm text-gray-500">読み込み中...</div>
          ) : users.length === 0 ? (
            <div className="text-sm text-gray-500">作業者が登録されていません</div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {users.map((user) => {
                const isSelected = selectedWorkers.includes(user.id);
                return (
                  <button
                    key={user.id}
                    type="button"
                    onClick={() => handleToggleWorker(user.id)}
                    className={`px-3 py-2 text-sm rounded-md border transition-colors ${
                      isSelected
                        ? "bg-blue-500 text-white border-blue-500"
                        : "bg-white text-gray-700 border-gray-300 hover:border-blue-500"
                    }`}
                  >
                    {user.display_name}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}