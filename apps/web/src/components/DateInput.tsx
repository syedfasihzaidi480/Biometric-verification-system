import { useMemo, useState } from "react";

type Props = {
  value: string; // expects DD/MM/YYYY but accepts YYYY-MM-DD too
  onChange: (val: string) => void;
  placeholder?: string;
  min?: string; // YYYY-MM-DD
  max?: string; // YYYY-MM-DD
  className?: string;
  inputClassName?: string;
};

const toISO = (disp: string) => {
  const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(disp || "");
  if (!m) return disp || "";
  return `${m[3]}-${m[2]}-${m[1]}`;
};

const toDisplay = (iso: string) => {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso || "");
  if (!m) return iso || "";
  return `${m[3]}/${m[2]}/${m[1]}`;
};

export default function DateInput({ value, onChange, placeholder = "DD/MM/YYYY", min, max, className, inputClassName }: Props) {
  const [manual, setManual] = useState(false);
  const isoValue = useMemo(() => {
    if (/^\d{4}-\d{2}-\d{2}$/.test(value || "")) return value;
    return toISO(value || "");
  }, [value]);

  if (manual) {
    return (
      <div className={className}>
        <input
          type="text"
          value={value || ""}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={inputClassName || "w-full px-3 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"}
        />
        <div className="mt-1 text-right">
          <button type="button" className="text-sm text-blue-600" onClick={() => setManual(false)}>
            Use calendar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={className}>
      <input
        type="date"
        value={isoValue || ""}
        onChange={(e) => onChange(toDisplay(e.target.value))}
        min={min}
        max={max}
        className={inputClassName || "w-full px-3 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"}
      />
      <div className="mt-1 text-right">
        <button type="button" className="text-sm text-blue-600" onClick={() => setManual(true)}>
          Type manually
        </button>
      </div>
    </div>
  );
}
