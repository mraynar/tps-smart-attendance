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
      <div className="card" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <div className="skeleton" style={{ width: 44, height: 44, borderRadius: 12 }} />
        <div className="skeleton" style={{ width: "60%", height: 14, borderRadius: 6 }} />
        <div className="skeleton" style={{ width: "40%", height: 32, borderRadius: 8 }} />
      </div>
    );
  }

  return (
    <div
      className="card animate-fade-in-up"
      style={{ display: "flex", flexDirection: "column", gap: 16, cursor: "default" }}
    >
      <div style={{
        width: 44, height: 44, borderRadius: 12,
        background: iconBg,
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        <Icon size={22} style={{ color: iconColor }} />
      </div>

      <div>
        <div style={{ fontSize: 13, fontWeight: 500, color: "var(--color-text-muted)", marginBottom: 6 }}>
          {label}
        </div>
        <div style={{ fontSize: 32, fontWeight: 800, color: "var(--color-text-dark)", lineHeight: 1, letterSpacing: "-1px" }}>
          {value.toLocaleString("id-ID")}
        </div>
      </div>

      {trend && (
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{
            padding: "3px 8px", borderRadius: 999,
            background: trend.value >= 0 ? "#DCFCE7" : "#FEF2F2",
            color: trend.value >= 0 ? "#15803D" : "var(--color-danger)",
            fontSize: 12, fontWeight: 600,
          }}>
            {trend.value >= 0 ? "+" : ""}{trend.value}%
          </span>
          <span style={{ fontSize: 12, color: "var(--color-text-muted)" }}>{trend.label}</span>
        </div>
      )}
    </div>
  );
}
