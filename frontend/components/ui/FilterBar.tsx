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
        padding: "12px 16px",
        background: "#fff",
        borderRadius: 12,
        border: "1px solid rgba(229, 231, 235, 0.6)",
        marginBottom: 20,
        boxShadow: "0 1px 3px rgba(11,63,107,0.02)",
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
        style={{
          width: 150,
          borderRadius: 8,
          fontSize: 13,
          height: 38,
          border: "1.5px solid rgba(229, 231, 235, 0.8)",
        }}
        aria-label="Tanggal mulai"
      />
      <span style={{ color: "var(--color-text-muted)", fontSize: 13, fontWeight: 600 }}>–</span>
      <input
        id={`${idPrefix}-end`}
        type="date"
        value={endDate}
        onChange={(e) => onEndChange(e.target.value)}
        className="input-field"
        style={{
          width: 150,
          borderRadius: 8,
          fontSize: 13,
          height: 38,
          border: "1.5px solid rgba(229, 231, 235, 0.8)",
        }}
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
    <div style={{ position: "relative", display: "inline-block" }}>
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="input-field"
        style={{
          width: "auto",
          minWidth: 140,
          borderRadius: 8,
          fontSize: 13,
          fontWeight: 500,
          cursor: "pointer",
          height: 38,
          paddingRight: 32,
          border: "1.5px solid rgba(229, 231, 235, 0.8)",
          background: "#fff",
        }}
      >
        <option value="">{placeholder}</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <div style={{
        position: "absolute",
        right: 12,
        top: "50%",
        transform: "translateY(-50%)",
        pointerEvents: "none",
        color: "var(--color-text-muted)",
        fontSize: 10,
        fontWeight: "bold",
      }}>
        ▼
      </div>
    </div>
  );
}
