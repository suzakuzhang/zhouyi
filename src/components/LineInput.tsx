"use client";

interface LineInputProps {
  position: number;
  value: number;
  changing: boolean;
  onChange: (value: number, changing: boolean) => void;
}

const posLabels = ["初", "二", "三", "四", "五", "上"];

export default function LineInput({ position, value, changing, onChange }: LineInputProps) {
  return (
    <div className="flex items-center gap-3 py-1">
      <span className="w-8 text-sm text-[var(--muted)]">{posLabels[position - 1]}</span>

      <button
        type="button"
        onClick={() => onChange(value === 1 ? 0 : 1, changing)}
        className={`
          w-20 h-8 rounded border text-sm font-medium transition-colors
          ${value === 1
            ? "bg-[#1a1a1a] text-white border-[#1a1a1a]"
            : "bg-white text-[#1a1a1a] border-[var(--border)]"
          }
        `}
      >
        {value === 1 ? "阳 ━" : "阴 ╍"}
      </button>

      <label className="flex items-center gap-1.5 text-sm cursor-pointer">
        <input
          type="checkbox"
          checked={changing}
          onChange={(e) => onChange(value, e.target.checked)}
          className="w-4 h-4"
        />
        <span className={changing ? "text-[#b45309] font-medium" : "text-[var(--muted)]"}>
          动
        </span>
      </label>
    </div>
  );
}
