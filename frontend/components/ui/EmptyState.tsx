import { type LucideIcon, Inbox } from "lucide-react";

interface EmptyStateProps {
  icon?: LucideIcon;
  title?: string;
  description?: string;
  action?: React.ReactNode;
}

export default function EmptyState({
  icon: Icon = Inbox,
  title = "Tidak ada data",
  description = "Belum ada data yang tersedia saat ini.",
  action,
}: EmptyStateProps) {
  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      padding: "64px 24px",
      gap: 16,
      textAlign: "center",
    }}>
      <div style={{
        width: 72, height: 72, borderRadius: "50%",
        background: "var(--color-primary-soft)",
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        <Icon size={32} style={{ color: "var(--color-primary-light)" }} />
      </div>
      <div>
        <div style={{ fontSize: 16, fontWeight: 700, color: "var(--color-text-dark)", marginBottom: 6 }}>
          {title}
        </div>
        <div style={{ fontSize: 14, color: "var(--color-text-muted)", maxWidth: 280 }}>
          {description}
        </div>
      </div>
      {action && <div style={{ marginTop: 8 }}>{action}</div>}
    </div>
  );
}
