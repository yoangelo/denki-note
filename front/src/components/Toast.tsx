import { useEffect, useState } from "react";

type ToastItem = {
  id: string;
  message: string;
  type: "success" | "error" | "info";
};

type ToastProps = {
  toasts: ToastItem[];
  onRemove: (id: string) => void;
  duration?: number;
};

function ToastItem({
  toast,
  onRemove,
  duration = 3000,
}: {
  toast: ToastItem;
  onRemove: (id: string) => void;
  duration?: number;
}) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    // エラー時は自動で閉じない
    if (toast.type === "error") return;

    const timer = setTimeout(() => {
      setVisible(false);
      setTimeout(() => onRemove(toast.id), 300);
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onRemove, toast.id, toast.type]);

  const bgColor = {
    success: "bg-green-500",
    error: "bg-red-500",
    info: "bg-blue-500",
  }[toast.type];

  const handleClose = () => {
    setVisible(false);
    setTimeout(() => onRemove(toast.id), 300);
  };

  if (!visible) return null;

  return (
    <div
      className={`px-6 py-3 text-white rounded-lg shadow-lg transition-all duration-300 ${bgColor} ${
        visible ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-2"
      }`}
    >
      <div className="flex items-center gap-2">
        {toast.type === "success" && <div className="i-heroicons-check-circle-solid w-5 h-5" />}
        {toast.type === "error" && <div className="i-heroicons-x-circle-solid w-5 h-5" />}
        {toast.type === "info" && <div className="i-heroicons-information-circle-solid w-5 h-5" />}
        <span>{toast.message}</span>
        {toast.type === "error" && (
          <button
            onClick={handleClose}
            className="ml-2 text-white hover:text-gray-200"
            aria-label="閉じる"
          >
            <div className="i-heroicons-x-mark w-5 h-5" />
          </button>
        )}
      </div>
    </div>
  );
}

export function Toast({ toasts, onRemove, duration = 3000 }: ToastProps) {
  return (
    <div className="fixed top-5 right-5 z-50 flex flex-col gap-2">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onRemove={onRemove} duration={duration} />
      ))}
    </div>
  );
}
