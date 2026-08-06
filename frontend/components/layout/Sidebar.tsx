"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  UserCheck,
  CarFront,
  Users,
  Truck,
  Camera,
  LogOut,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";

const navItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/attendance", label: "Riwayat Absensi", icon: UserCheck },
  { href: "/plates", label: "Deteksi Plat", icon: CarFront },
  { href: "/persons", label: "Pegawai & Sopir", icon: Users },
  { href: "/vehicles", label: "Kendaraan", icon: Truck },
  { href: "/cameras", label: "Kamera", icon: Camera },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();
  const [collapsed, setCollapsed] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    // Set initial collapse state based on window size
    if (typeof window !== "undefined") {
      if (window.innerWidth < 1024) {
        setCollapsed(true);
      }
    }

    const handleResize = () => {
      if (window.innerWidth < 1024) {
        setCollapsed(true);
      } else {
        setCollapsed(false);
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  async function handleLogout() {
    setLoggingOut(true);
    await supabase.auth.signOut();
    router.push("/login");
  }

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <aside
      style={{
        width: collapsed ? 68 : 240,
        minHeight: "100vh",
        background: "#ffffff",
        borderRight: "1px solid #F3F4F6",
        display: "flex",
        flexDirection: "column",
        transition: "width 0.25s cubic-bezier(0.4,0,0.2,1)",
        position: "sticky",
        top: 0,
        flexShrink: 0,
        zIndex: 40,
        boxShadow: "2px 0 8px rgba(0,0,0,0.04)",
      }}
    >
      {/* Brand */}
      <div style={{
        padding: collapsed ? "18px 16px" : "18px 20px",
        borderBottom: "1px solid #F3F4F6",
        display: "flex",
        alignItems: "center",
        justifyContent: collapsed ? "center" : "flex-start",
        overflow: "hidden",
        minHeight: 72,
      }}>
        {/* Logo */}
        <div style={{
          width: collapsed ? 36 : 116,
          height: 36,
          position: "relative",
          flexShrink: 0,
          transition: "width 0.25s cubic-bezier(0.4,0,0.2,1)",
        }}>
          {/* Collapsed Logo (Pelindo Square) */}
          <div style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: 36,
            height: 36,
            opacity: collapsed ? 1 : 0,
            pointerEvents: collapsed ? "auto" : "none",
            transition: "opacity 0.2s ease-in-out",
          }}>
            <Image
              src="/Images/Logo/Logo Pelindo.png"
              alt="Logo Pelindo"
              width={36}
              height={36}
              unoptimized
              style={{
                width: "36px",
                height: "36px",
                display: "block",
              }}
              priority
            />
          </div>

          {/* Expanded Logo (TPS Full) */}
          <div style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: 116,
            height: 36,
            opacity: collapsed ? 0 : 1,
            pointerEvents: collapsed ? "none" : "auto",
            transition: "opacity 0.2s ease-in-out",
            overflow: "hidden",
          }}>
            <Image
              src="/Images/Logo/Logo_TPS.png"
              alt="Logo TPS"
              width={116}
              height={36}
              unoptimized
              style={{
                width: "116px",
                height: "36px",
                display: "block",
              }}
              priority
            />
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: "16px 12px", display: "flex", flexDirection: "column", gap: 4 }}>
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = isActive(href);
          return (
            <Link
              key={href}
              href={href}
              title={collapsed ? label : undefined}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: collapsed ? "12px" : "10px 14px",
                borderRadius: 8,
                textDecoration: "none",
                background: active ? "var(--color-primary-soft)" : "transparent",
                color: active ? "var(--color-primary)" : "var(--color-text-muted)",
                fontWeight: active ? 700 : 500,
                fontSize: 14,
                transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
                overflow: "hidden",
                whiteSpace: "nowrap",
                justifyContent: collapsed ? "center" : "flex-start",
                position: "relative",
              }}
              onMouseEnter={(e) => {
                if (!active) {
                  (e.currentTarget as HTMLElement).style.background = "var(--color-neutral-bg)";
                  (e.currentTarget as HTMLElement).style.color = "var(--color-primary)";
                }
              }}
              onMouseLeave={(e) => {
                if (!active) {
                  (e.currentTarget as HTMLElement).style.background = "transparent";
                  (e.currentTarget as HTMLElement).style.color = "var(--color-text-muted)";
                }
              }}
            >
              <Icon size={18} style={{
                flexShrink: 0,
                transition: "transform 0.2s ease",
                transform: active ? "scale(1.05)" : "none",
              }} />
              {!collapsed && <span>{label}</span>}
              {active && !collapsed && (
                <div style={{
                  position: "absolute",
                  left: 0,
                  top: "20%",
                  height: "60%",
                  width: 3,
                  background: "var(--color-primary)",
                  borderRadius: "0 4px 4px 0",
                }} />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Collapse toggle + Logout */}
      <div style={{ padding: "16px 12px", borderTop: "1px solid #F3F4F6", display: "flex", flexDirection: "column", gap: 6 }}>
        <button
          onClick={() => setCollapsed(!collapsed)}
          title={collapsed ? "Perluas sidebar" : "Collapse sidebar"}
          style={{
            display: "flex", alignItems: "center", gap: 12,
            padding: collapsed ? "12px" : "10px 14px",
            borderRadius: 8, border: "none", cursor: "pointer",
            background: "transparent", color: "var(--color-text-muted)",
            fontWeight: 500, fontSize: 14, width: "100%",
            justifyContent: collapsed ? "center" : "flex-start",
            transition: "all 0.2s ease",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.background = "var(--color-neutral-bg)";
            (e.currentTarget as HTMLElement).style.color = "var(--color-text-dark)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.background = "transparent";
            (e.currentTarget as HTMLElement).style.color = "var(--color-text-muted)";
          }}
        >
          {collapsed ? <ChevronRight size={18} /> : <><ChevronLeft size={18} /> Collapse</>}
        </button>

        <button
          onClick={handleLogout}
          disabled={loggingOut}
          style={{
            display: "flex", alignItems: "center", gap: 12,
            padding: collapsed ? "12px" : "10px 14px",
            borderRadius: 8, border: "none", cursor: "pointer",
            background: "transparent", color: "var(--color-danger)",
            fontWeight: 500, fontSize: 14, width: "100%",
            justifyContent: collapsed ? "center" : "flex-start",
            opacity: loggingOut ? 0.6 : 1,
            transition: "all 0.2s ease",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.background = "#FEF2F2";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.background = "transparent";
          }}
          title={collapsed ? "Keluar" : undefined}
        >
          <LogOut size={18} style={{ flexShrink: 0 }} />
          {!collapsed && (loggingOut ? "Keluar..." : "Keluar")}
        </button>
      </div>
    </aside>
  );
}
