"use client";

interface FilterBarProps {
  children: React.ReactNode;
}

export default function FilterBar({ children }: FilterBarProps) {
  return (
    <div
      style={{
        display: "flex",
        flexWrap: "wrap",
        gap: 12,
        alignItems: "center",
        padding: "16px 20px",
        background: "#fff",
        borderRadius: 16,
        border: "1px solid #F3F4F6",
        marginBottom: 20,
      }}
    >
      {children}
    </div>
  );
}

interface DateRangePickerProps {
  startDate: string;
  endDate: string;
  onStartChange: (v: string) => void;
  onEndChange: (v: string) => void;
  idPrefix?: string;
}

export function DateRangePicker({
  startDate,
  endDate,
  onStartChange,
  onEndChange,
  idPrefix = "date",
}: DateRangePickerProps) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <input
        id={`${idPrefix}-start`}
        type="date"
        value={startDate}
        onChange={(e) => onStartChange(e.target.value)}
        className="input-field"
        style={{ width: 160, borderRadius: 10, fontSize: 13 }}
        aria-label="Tanggal mulai"
      />
      <span style={{ color: "var(--color-text-muted)", fontSize: 14 }}>–</span>
      <input
        id={`${idPrefix}-end`}
        type="date"
        value={endDate}
        onChange={(e) => onEndChange(e.target.value)}
        className="input-field"
        style={{ width: 160, borderRadius: 10, fontSize: 13 }}
        aria-label="Tanggal akhir"
      />
    </div>
  );
}

interface SelectFilterProps {
  id: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  placeholder?: string;
}

export function SelectFilter({ id, value, onChange, options, placeholder = "Semua" }: SelectFilterProps) {
  return (
    <select
      id={id}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="input-field"
      style={{ width: "auto", minWidth: 140, borderRadius: 10, fontSize: 13, cursor: "pointer" }}
    >
      <option value="">{placeholder}</option>
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}
