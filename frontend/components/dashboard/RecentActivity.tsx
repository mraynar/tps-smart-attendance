import StatusBadge from "@/components/ui/StatusBadge";
import Link from "next/link";
import { User, Car } from "lucide-react";

interface ActivityItem {
  id: string;
  type: "attendance" | "plate";
  timestamp: string;
  label: string;
  sublabel?: string;
  status?: string;
}

interface RecentActivityProps {
  items: ActivityItem[];
  loading?: boolean;
}

function formatTime(ts: string) {
  return new Date(ts).toLocaleString("id-ID", {
    day: "2-digit", month: "short",
    hour: "2-digit", minute: "2-digit",
  });
}

export default function RecentActivity({ items, loading = false }: RecentActivityProps) {
  if (loading) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {[...Array(5)].map((_, i) => (
          <div key={i} style={{ display: "flex", gap: 12, alignItems: "center" }}>
            <div className="skeleton" style={{ width: 36, height: 36, borderRadius: "50%", flexShrink: 0 }} />
            <div style={{ flex: 1 }}>
              <div className="skeleton" style={{ height: 13, width: "60%", marginBottom: 6 }} />
              <div className="skeleton" style={{ height: 11, width: "40%" }} />
            </div>
            <div className="skeleton" style={{ height: 22, width: 70, borderRadius: 999 }} />
          </div>
        ))}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div style={{ padding: "32px", textAlign: "center", color: "var(--color-text-muted)", fontSize: 14 }}>
        Belum ada aktivitas hari ini.
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column" }}>
      {items.map((item, idx) => (
        <div
          key={item.id}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 14,
            padding: "12px 0",
            borderBottom: idx < items.length - 1 ? "1px solid #F3F4F6" : "none",
          }}
        >
          {/* Type icon dot */}
          <div style={{
            width: 36, height: 36, borderRadius: "50%", flexShrink: 0,
            background: item.type === "attendance" ? "var(--color-primary-soft)" : "#EDE9FE",
            display: "flex", alignItems: "center", justifyContent: "center",
            color: item.type === "attendance" ? "var(--color-primary)" : "#7C3AED",
          }}>
            {item.type === "attendance" ? <User size={18} /> : <Car size={18} />}
          </div>

          {/* Text */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              fontSize: 14, fontWeight: 600, color: "var(--color-text-dark)",
              whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
            }}>
              {item.label}
            </div>
            {item.sublabel && (
              <div style={{ fontSize: 12, color: "var(--color-text-muted)", marginTop: 2 }}>
                {item.sublabel}
              </div>
            )}
          </div>

          {/* Status + time */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4, flexShrink: 0 }}>
            {item.status && (
              <StatusBadge
                variant={item.status as any}
                size="sm"
              />
            )}
            <span style={{ fontSize: 11, color: "var(--color-text-muted)" }}>
              {formatTime(item.timestamp)}
            </span>
          </div>
        </div>
      ))}

      <div style={{ paddingTop: 16, textAlign: "center" }}>
        <Link
          href="/attendance"
          style={{ fontSize: 13, color: "var(--color-primary)", fontWeight: 600, textDecoration: "none" }}
        >
          Lihat semua aktivitas →
        </Link>
      </div>
    </div>
  );
}
