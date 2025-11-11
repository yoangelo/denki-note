import type { ReactNode } from "react";

export type AlertVariant = "info" | "success" | "warning" | "error";

interface AlertProps {
  variant?: AlertVariant;
  title?: string;
  children: ReactNode;
  onClose?: () => void;
  className?: string;
}

const variantStyles: Record<AlertVariant, { container: string; icon: string; iconClass: string }> =
  {
    info: {
      container: "bg-blue-50 border-blue-200 text-blue-800",
      icon: "i-heroicons-information-circle-solid",
      iconClass: "text-blue-500",
    },
    success: {
      container: "bg-green-50 border-green-200 text-green-800",
      icon: "i-heroicons-check-circle-solid",
      iconClass: "text-green-500",
    },
    warning: {
      container: "bg-yellow-50 border-yellow-200 text-yellow-800",
      icon: "i-heroicons-exclamation-triangle-solid",
      iconClass: "text-yellow-500",
    },
    error: {
      container: "bg-red-50 border-red-200 text-red-800",
      icon: "i-heroicons-x-circle-solid",
      iconClass: "text-red-500",
    },
  };

export function Alert({ variant = "info", title, children, onClose, className = "" }: AlertProps) {
  const styles = variantStyles[variant];

  return (
    <div
      className={`flex items-start gap-3 p-4 border rounded-lg ${styles.container} ${className}`}
      role="alert"
    >
      <div className={`${styles.icon} w-5 h-5 flex-shrink-0 mt-0.5 ${styles.iconClass}`} />
      <div className="flex-1">
        {title && <h4 className="font-semibold mb-1">{title}</h4>}
        <div className="text-sm">{children}</div>
      </div>
      {onClose && (
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0"
          aria-label="閉じる"
        >
          <div className="i-heroicons-x-mark w-5 h-5" />
        </button>
      )}
    </div>
  );
}
