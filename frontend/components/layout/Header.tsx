"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Bell, Smile } from "lucide-react";

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good Morning";
  if (hour < 17) return "Good Afternoon";
  return "Good Evening";
}

function formatDate(date: Date) {
  return date.toLocaleDateString("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export default function Header() {
  const supabase = createClient();
  const [userName, setUserName] = useState<string>("Admin");

  useEffect(() => {
    async function fetchProfile() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", user.id)
        .single();
      if (data?.full_name) setUserName(data.full_name.split(" ")[0]);
    }
    fetchProfile();
  }, [supabase]);

  const now = new Date();

  return (
    <header style={{
      height: 72,
      background: "rgba(255, 255, 255, 0.85)",
      backdropFilter: "blur(12px)",
      WebkitBackdropFilter: "blur(12px)",
      borderBottom: "1px solid rgba(229, 231, 235, 0.6)",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      padding: "0 28px",
      position: "sticky",
      top: 0,
      zIndex: 30,
      boxShadow: "0 1px 3px rgba(0,0,0,0.02), 0 4px 12px rgba(11,63,107,0.03)",
    }}>
      {/* Greeting */}
      <div>
        <div style={{
          fontSize: 16,
          fontWeight: 700,
          color: "var(--color-text-dark)",
          lineHeight: 1.3,
          display: "flex",
          alignItems: "center",
          gap: 6
        }}>
          <span>{getGreeting()}, <span style={{ color: "var(--color-primary)", fontWeight: 800 }}>{userName}</span></span>
          <Smile size={18} style={{ color: "var(--color-primary-light)" }} />
        </div>
        <div style={{ fontSize: 12, color: "var(--color-text-muted)", marginTop: 4, fontWeight: 500 }}>
          {formatDate(now)}
        </div>
      </div>

      {/* Right side */}
      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
        {/* Live status chip */}
        <div style={{
          display: "flex", alignItems: "center", gap: 6,
          padding: "5px 12px", borderRadius: 999,
          background: "rgba(34, 197, 94, 0.08)",
          border: "1px solid rgba(34, 197, 94, 0.25)",
          color: "#15803D",
          fontSize: 12, fontWeight: 700,
        }}>
          <span style={{
            width: 7, height: 7, borderRadius: "50%",
            background: "#22C55E",
            boxShadow: "0 0 6px rgba(34, 197, 94, 0.6)",
          }} />
          <span>Sistem Online</span>
        </div>

        {/* Notification bell */}
        <button
          style={{
            width: 38, height: 38, borderRadius: "50%",
            background: "#fff",
            border: "1px solid #E5E7EB",
            display: "flex", alignItems: "center", justifyContent: "center",
            cursor: "pointer", color: "var(--color-text-muted)",
            boxShadow: "0 1px 2px rgba(0,0,0,0.02)",
            transition: "all 0.15s ease",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = "var(--color-primary-light)";
            e.currentTarget.style.color = "var(--color-primary)";
            e.currentTarget.style.background = "var(--color-primary-soft)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = "#E5E7EB";
            e.currentTarget.style.color = "var(--color-text-muted)";
            e.currentTarget.style.background = "#fff";
          }}
          aria-label="Notifikasi"
        >
          <Bell size={16} />
        </button>

        {/* Avatar */}
        <div style={{
          width: 38, height: 38, borderRadius: "50%",
          background: "linear-gradient(135deg, var(--color-primary) 0%, var(--color-navy) 100%)",
          display: "flex", alignItems: "center", justifyContent: "center",
          color: "#fff", fontWeight: 700, fontSize: 14,
          boxShadow: "0 2px 8px rgba(0,114,188,0.2)",
          cursor: "default",
          flexShrink: 0,
          border: "2px solid #fff",
        }}>
          {userName.charAt(0).toUpperCase()}
        </div>
      </div>
    </header>
  );
}
