import { type LucideIcon } from "lucide-react";

interface StatCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  iconColor?: string;
  iconBg?: string;
  trend?: {
    value: number;
    label: string;
  };
  loading?: boolean;
}

export default function StatCard({
  label,
  value,
  icon: Icon,
  iconColor = "var(--color-primary)",
  iconBg = "var(--color-primary-soft)",
  trend,
  loading = false,
}: StatCardProps) {
  if (loading) {
    return (
      <div className="card" style={{ display: "flex", flexDirection: "column", gap: 14, border: "1px solid rgba(229, 231, 235, 0.5)" }}>
        <div className="skeleton" style={{ width: 40, height: 40, borderRadius: 10 }} />
        <div className="skeleton" style={{ width: "50%", height: 12, borderRadius: 6 }} />
        <div className="skeleton" style={{ width: "35%", height: 28, borderRadius: 6 }} />
      </div>
    );
  }

  return (
    <div
      className="card animate-fade-in-up"
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 14,
        cursor: "default",
        transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
        border: "1px solid rgba(229, 231, 235, 0.5)",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = "translateY(-4px)";
        e.currentTarget.style.boxShadow = "0 10px 25px -5px rgba(11,63,107,0.08), 0 8px 16px -6px rgba(11,63,107,0.04)";
        e.currentTarget.style.borderColor = "rgba(0, 114, 188, 0.15)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "translateY(0)";
        e.currentTarget.style.boxShadow = "0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.04)";
        e.currentTarget.style.borderColor = "rgba(229, 231, 235, 0.5)";
      }}
    >
      <div style={{
        width: 40, height: 40, borderRadius: 10,
        background: iconBg,
        display: "flex", alignItems: "center", justifyContent: "center",
        transition: "transform 0.2s ease",
      }}>
        <Icon size={20} style={{ color: iconColor }} />
      </div>

      <div>
        <div style={{ fontSize: 13, fontWeight: 600, color: "var(--color-text-muted)", marginBottom: 4 }}>
          {label}
        </div>
        <div style={{ fontSize: 28, fontWeight: 800, color: "var(--color-text-dark)", lineHeight: 1.2, letterSpacing: "-0.5px" }}>
          {value.toLocaleString("id-ID")}
        </div>
      </div>

      {trend && (
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 2 }}>
          <span style={{
            padding: "2px 8px", borderRadius: 999,
            background: trend.value >= 0 ? "#DCFCE7" : "#FEF2F2",
            color: trend.value >= 0 ? "#15803D" : "var(--color-danger)",
            fontSize: 11, fontWeight: 700,
          }}>
            {trend.value >= 0 ? "+" : ""}{trend.value}%
          </span>
          <span style={{ fontSize: 11, color: "var(--color-text-muted)", fontWeight: 500 }}>{trend.label}</span>
        </div>
      )}
    </div>
  );
}
