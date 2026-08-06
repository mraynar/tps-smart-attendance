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
      padding: "80px 24px",
      gap: 20,
      textAlign: "center",
      background: "rgba(249, 250, 251, 0.5)",
      borderRadius: 12,
      border: "1px dashed rgba(229, 231, 235, 0.8)",
      margin: "12px",
    }}>
      <div style={{
        width: 64, height: 64, borderRadius: "50%",
        background: "var(--color-primary-soft)",
        display: "flex", alignItems: "center", justifyContent: "center",
        boxShadow: "0 4px 12px rgba(0, 114, 188, 0.05)",
      }}>
        <Icon size={28} style={{ color: "var(--color-primary)" }} />
      </div>
      <div>
        <div style={{ fontSize: 15, fontWeight: 700, color: "var(--color-text-dark)", marginBottom: 6, letterSpacing: "-0.1px" }}>
          {title}
        </div>
        <div style={{ fontSize: 13, color: "var(--color-text-muted)", maxWidth: 300, lineHeight: 1.5 }}>
          {description}
        </div>
      </div>
      {action && <div style={{ marginTop: 4 }}>{action}</div>}
    </div>
  );
}
