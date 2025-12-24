import { useEffect } from "react";
import type { ReactNode } from "react";

interface FullScreenModalProps {
  title: string;
  children: ReactNode;
  onCloseRequest: () => void;
  rightHeaderContent?: ReactNode;
}

export function FullScreenModal({
  title,
  children,
  onCloseRequest,
  rightHeaderContent,
}: FullScreenModalProps) {
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "unset";
    };
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black bg-opacity-50">
      <div className="flex-1 flex flex-col m-4 bg-gray-50 rounded-lg shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 bg-white border-b border-gray-200">
          <h1 className="text-xl font-bold text-gray-900">{title}</h1>
          <div className="flex items-center gap-4">
            {rightHeaderContent}
            <button
              onClick={onCloseRequest}
              className="text-gray-400 hover:text-gray-600 transition-colors p-2 rounded-lg hover:bg-gray-100"
              aria-label="閉じる"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6">{children}</div>
      </div>
    </div>
  );
}
