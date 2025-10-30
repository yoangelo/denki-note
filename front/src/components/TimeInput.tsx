import { useState, useCallback } from "react";

type TimeInputProps = {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
};

export function TimeInput({ value, onChange, min = 0, max = 24 }: TimeInputProps) {
  const [isFocused, setIsFocused] = useState(false);

  // クイック入力ボタン
  const quickButtons = [
    { label: "0.25h", value: 0.25 },
    { label: "0.5h", value: 0.5 },
    { label: "1h", value: 1 },
    { label: "2h", value: 2 },
    { label: "4h", value: 4 },
    { label: "8h", value: 8 },
  ];

  const increment = useCallback(() => {
    const newValue = Math.min(value + 0.25, max);
    onChange(newValue);
  }, [value, max, onChange]);

  const decrement = useCallback(() => {
    const newValue = Math.max(value - 0.25, min);
    onChange(newValue);
  }, [value, min, onChange]);

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const inputValue = e.target.value;
      if (inputValue === "") {
        onChange(0);
        return;
      }
      const num = parseFloat(inputValue);
      if (!isNaN(num)) {
        // 0.25単位に丸める
        const rounded = Math.round(num * 4) / 4;
        const clamped = Math.max(min, Math.min(max, rounded));
        onChange(clamped);
      }
    },
    [min, max, onChange]
  );

  const handleQuickInput = useCallback(
    (quickValue: number) => {
      onChange(quickValue);
    },
    [onChange]
  );

  // 時間を見やすく表示
  const formatTime = (hours: number) => {
    if (hours === 0) return "0h";
    const h = Math.floor(hours);
    const m = (hours - h) * 60;
    if (m === 0) return `${h}h`;
    return `${h}h${m}分`;
  };

  return (
    <div className="relative">
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={decrement}
          disabled={value <= min}
          className={`p-1.5 rounded-lg transition-all ${
            value <= min
              ? "bg-gray-100 text-gray-400 cursor-not-allowed"
              : "bg-gray-200 hover:bg-gray-300 text-gray-700"
          }`}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
          </svg>
        </button>

        <div className="relative">
          <input
            type="number"
            value={value || ""}
            onChange={handleInputChange}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setTimeout(() => setIsFocused(false), 200)}
            step="0.25"
            min={min}
            max={max}
            className={`w-20 px-2 py-1.5 text-center border rounded-lg font-medium transition-all ${
              value > 0
                ? "bg-blue-50 border-blue-300 text-blue-700"
                : "bg-white border-gray-300 text-gray-700"
            } focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
            placeholder="0"
          />
          {value > 0 && (
            <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 text-xs text-gray-600 whitespace-nowrap">
              {formatTime(value)}
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={increment}
          disabled={value >= max}
          className={`p-1.5 rounded-lg transition-all ${
            value >= max
              ? "bg-gray-100 text-gray-400 cursor-not-allowed"
              : "bg-gray-200 hover:bg-gray-300 text-gray-700"
          }`}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        </button>
      </div>

      {/* クイック入力パネル */}
      {isFocused && (
        <div className="absolute top-10 left-0 z-10 bg-white border-2 border-blue-300 rounded-lg shadow-lg p-2 min-w-[200px]">
          <div className="text-xs text-gray-600 mb-2 font-medium">クイック入力</div>
          <div className="grid grid-cols-3 gap-1">
            {quickButtons.map((btn) => (
              <button
                key={btn.label}
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => handleQuickInput(btn.value)}
                className={`px-2 py-1.5 text-sm rounded transition-all ${
                  value === btn.value
                    ? "bg-blue-500 text-white"
                    : "bg-gray-100 hover:bg-blue-100 text-gray-700"
                }`}
              >
                {btn.label}
              </button>
            ))}
          </div>
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => handleQuickInput(0)}
            className="mt-2 w-full px-2 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 rounded text-gray-700"
          >
            クリア
          </button>
        </div>
      )}
    </div>
  );
}
