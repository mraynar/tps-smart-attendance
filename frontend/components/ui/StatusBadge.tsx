type AttendanceStatus = "recognized" | "unrecognized" | "rejected_spoof";
type PersonType = "employee" | "driver";
type VehicleType = "truck" | "car" | "motorcycle" | "other";
type CameraStatus = "active" | "inactive";
type DashboardRole = "admin" | "staff" | "viewer";
type ActivityType = "attendance" | "plate";

type BadgeVariant =
  | AttendanceStatus
  | PersonType
  | VehicleType
  | CameraStatus
  | DashboardRole
  | ActivityType
  | "default";

const BADGE_CONFIG: Record<
  BadgeVariant,
  { label: string; bg: string; color: string; dot?: string }
> = {
  recognized:     { label: "Dikenali",      bg: "#DCFCE7", color: "#15803D", dot: "#22C55E" },
  unrecognized:   { label: "Tidak Dikenal", bg: "#FEF3C7", color: "#92400E", dot: "#F59E0B" },
  rejected_spoof: { label: "Spoofing",      bg: "#FEF2F2", color: "#991B1B", dot: "#EF4444" },
  employee:       { label: "Pegawai",       bg: "var(--color-primary-soft)", color: "var(--color-primary)" },
  driver:         { label: "Sopir",         bg: "#EDE9FE", color: "#6D28D9" },
  truck:          { label: "Truk",          bg: "#FEF3C7", color: "#92400E" },
  car:            { label: "Mobil",         bg: "#DBEAFE", color: "#1D4ED8" },
  motorcycle:     { label: "Motor",         bg: "#FCE7F3", color: "#9D174D" },
  other:          { label: "Lainnya",       bg: "#F3F4F6", color: "#4B5563" },
  active:         { label: "Aktif",         bg: "#DCFCE7", color: "#15803D", dot: "#22C55E" },
  inactive:       { label: "Nonaktif",      bg: "#F3F4F6", color: "#6B7280", dot: "#D1D5DB" },
  admin:          { label: "Admin",         bg: "#FEF2F2", color: "#991B1B" },
  staff:          { label: "Staff",         bg: "#DBEAFE", color: "#1D4ED8" },
  viewer:         { label: "Viewer",        bg: "#F3F4F6", color: "#4B5563" },
  attendance:     { label: "Absensi",       bg: "var(--color-primary-soft)", color: "var(--color-primary)" },
  plate:          { label: "Plat",          bg: "#EDE9FE", color: "#6D28D9" },
  default:        { label: "–",             bg: "#F3F4F6", color: "#6B7280" },
};

interface StatusBadgeProps {
  variant: BadgeVariant;
  customLabel?: string;
  size?: "sm" | "md";
}

export default function StatusBadge({ variant, customLabel, size = "md" }: StatusBadgeProps) {
  const config = BADGE_CONFIG[variant] ?? BADGE_CONFIG.default;
  const label = customLabel ?? config.label;
  const padding = size === "sm" ? "2px 8px" : "4px 12px";
  const fontSize = size === "sm" ? 11 : 12;
  const isLive = ["recognized", "active"].includes(variant);

  return (
    <>
      <style>{`
        @keyframes badgePulse {
          0% { opacity: 0.6; transform: scale(0.85); }
          50% { opacity: 1; transform: scale(1.15); }
          100% { opacity: 0.6; transform: scale(0.85); }
        }
        .badge-pulse {
          animation: badgePulse 2s infinite ease-in-out;
        }
      `}</style>
      <span style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        padding,
        borderRadius: 999,
        background: config.bg,
        color: config.color,
        fontWeight: 700,
        fontSize,
        whiteSpace: "nowrap",
        lineHeight: 1.3,
        letterSpacing: "0.01em",
        border: "1px solid rgba(0,0,0,0.02)",
      }}>
        {config.dot && (
          <span
            className={isLive ? "badge-pulse" : ""}
            style={{
              width: 6,
              height: 6,
              borderRadius: "50%",
              background: config.dot,
              flexShrink: 0,
            }}
          />
        )}
        {label}
      </span>
    </>
  );
}

export type { BadgeVariant, AttendanceStatus, PersonType, VehicleType };
