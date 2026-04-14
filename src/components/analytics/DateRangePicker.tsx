import { useState, useRef, useEffect } from "react";
import { DayPicker } from "react-day-picker";
import { Calendar } from "lucide-react";
import "react-day-picker/style.css";

interface DateRange {
  from: Date;
  to: Date;
}

interface DateRangePickerProps {
  value: DateRange;
  onChange: (range: DateRange) => void;
}

const PRESETS = [
  { label: "최근 7일", days: 7 },
  { label: "최근 30일", days: 30 },
  { label: "최근 90일", days: 90 },
] as const;

function formatDate(date: Date): string {
  return date.toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}

export default function DateRangePicker({ value, onChange }: DateRangePickerProps) {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<{ from?: Date; to?: Date }>({
    from: value.from,
    to: value.to,
  });
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const applyPreset = (days: number) => {
    const to = new Date();
    const from = new Date();
    from.setDate(from.getDate() - days);
    onChange({ from, to });
    setSelected({ from, to });
    setOpen(false);
  };

  const handleSelect = (range: { from?: Date; to?: Date } | undefined) => {
    if (!range) return;
    setSelected(range);
    if (range.from && range.to) {
      const diffDays = Math.ceil(
        (range.to.getTime() - range.from.getTime()) / (1000 * 60 * 60 * 24)
      );
      if (diffDays <= 365) {
        onChange({ from: range.from, to: range.to });
        setOpen(false);
      }
    }
  };

  const today = new Date();

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50"
      >
        <Calendar className="h-4 w-4" />
        <span>
          {formatDate(value.from)} ~ {formatDate(value.to)}
        </span>
      </button>

      {open && (
        <div className="absolute top-full left-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg z-50 p-4">
          <div className="flex gap-2 mb-3">
            {PRESETS.map((preset) => (
              <button
                key={preset.days}
                onClick={() => applyPreset(preset.days)}
                className="px-3 py-1.5 text-xs font-medium rounded-md bg-gray-100 text-gray-700 hover:bg-primary-100 hover:text-primary-700"
              >
                {preset.label}
              </button>
            ))}
          </div>
          <DayPicker
            mode="range"
            selected={selected.from ? selected as { from: Date; to?: Date } : undefined}
            onSelect={handleSelect}
            disabled={{ after: today }}
            numberOfMonths={2}
            defaultMonth={new Date(today.getFullYear(), today.getMonth() - 1)}
          />
          <p className="text-xs text-gray-500 mt-2">최대 365일까지 선택 가능</p>
        </div>
      )}
    </div>
  );
}
