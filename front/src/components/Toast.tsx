import { useEffect, useState } from "react";

type ToastProps = {
  message: string;
  type?: "success" | "error" | "info";
  duration?: number;
  onClose?: () => void;
};

export function Toast({ message, type = "success", duration = 3000, onClose }: ToastProps) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    // エラー時は自動で閉じない
    if (type === "error") return;

    const timer = setTimeout(() => {
      setVisible(false);
      setTimeout(() => onClose?.(), 300);
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose, type]);

  const bgColor = {
    success: "bg-green-500",
    error: "bg-red-500",
    info: "bg-blue-500",
  }[type];

  const handleClose = () => {
    setVisible(false);
    setTimeout(() => onClose?.(), 300);
  };

  if (!visible) return null;

  return (
    <div
      className={`fixed top-5 right-5 z-50 px-6 py-3 text-white rounded-lg shadow-lg transition-all duration-300 ${bgColor} ${
        visible ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-2"
      }`}
    >
      <div className="flex items-center gap-2">
        {type === "success" && <span>✅</span>}
        {type === "error" && <span>❌</span>}
        {type === "info" && <span>ℹ️</span>}
        <span>{message}</span>
        {type === "error" && (
          <button
            onClick={handleClose}
            className="ml-2 text-white hover:text-gray-200 font-bold"
            aria-label="閉じる"
          >
            ✗
          </button>
        )}
      </div>
    </div>
  );
}
