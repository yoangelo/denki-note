import { useState, useEffect } from "react";

interface TimeInputProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
}

export function TimeInput({ value, onChange, min = 0, max = 24 }: TimeInputProps) {
  const [displayValue, setDisplayValue] = useState(value.toString());

  useEffect(() => {
    setDisplayValue(value.toString());
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    setDisplayValue(inputValue);

    const numValue = parseFloat(inputValue);
    if (!isNaN(numValue)) {
      // 0.25単位に丸める
      const rounded = Math.round(numValue * 4) / 4;
      if (rounded >= min && rounded <= max) {
        onChange(rounded);
      }
    }
  };

  const handleBlur = () => {
    // フォーカスが外れたときに0.25単位に丸める
    const numValue = parseFloat(displayValue);
    if (!isNaN(numValue)) {
      const rounded = Math.round(numValue * 4) / 4;
      const clamped = Math.min(Math.max(rounded, min), max);
      onChange(clamped);
      setDisplayValue(clamped.toString());
    } else {
      setDisplayValue(value.toString());
    }
  };

  const adjustTime = (delta: number) => {
    const newValue = Math.round((value + delta) * 4) / 4;
    const clamped = Math.min(Math.max(newValue, min), max);
    onChange(clamped);
  };

  return (
    <div className="flex items-center gap-1">
      <button
        type="button"
        onClick={() => adjustTime(-0.25)}
        className="w-6 h-6 bg-gray-200 hover:bg-gray-300 rounded text-xs font-bold"
        disabled={value <= min}
      >
        -
      </button>
      <input
        type="number"
        value={displayValue}
        onChange={handleChange}
        onBlur={handleBlur}
        step="0.25"
        min={min}
        max={max}
        className="w-16 px-2 py-1 text-center border border-gray-300 rounded text-sm"
      />
      <button
        type="button"
        onClick={() => adjustTime(0.25)}
        className="w-6 h-6 bg-gray-200 hover:bg-gray-300 rounded text-xs font-bold"
        disabled={value >= max}
      >
        +
      </button>
      <span className="text-xs text-gray-500">h</span>
    </div>
  );
}
