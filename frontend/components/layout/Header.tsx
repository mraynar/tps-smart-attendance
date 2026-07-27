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
      background: "#ffffff",
      borderBottom: "1px solid #F3F4F6",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      padding: "0 28px",
      position: "sticky",
      top: 0,
      zIndex: 30,
      boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
    }}>
      {/* Greeting */}
      <div>
        <div style={{ fontSize: 18, fontWeight: 700, color: "var(--color-text-dark)", lineHeight: 1.3,
          display: "flex", alignItems: "center", gap: 6 }}>
          <span>{getGreeting()}, <span style={{ color: "var(--color-primary)" }}>{userName}</span></span>
          <Smile size={20} style={{ color: "var(--color-primary-light)" }} />
        </div>
        <div style={{ fontSize: 13, color: "var(--color-text-muted)", marginTop: 2 }}>
          {formatDate(now)}
        </div>
      </div>

      {/* Right side */}
      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
        {/* Notification bell placeholder */}
        <button
          style={{
            width: 40, height: 40, borderRadius: "50%",
            background: "var(--color-neutral-bg)",
            border: "1px solid #E5E7EB",
            display: "flex", alignItems: "center", justifyContent: "center",
            cursor: "pointer", color: "var(--color-text-muted)",
          }}
          aria-label="Notifikasi"
        >
          <Bell size={18} />
        </button>

        {/* Avatar */}
        <div style={{
          width: 40, height: 40, borderRadius: "50%",
          background: "linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-dark) 100%)",
          display: "flex", alignItems: "center", justifyContent: "center",
          color: "#fff", fontWeight: 700, fontSize: 15,
          boxShadow: "0 2px 8px rgba(11,95,160,0.25)",
          cursor: "default",
          flexShrink: 0,
        }}>
          {userName.charAt(0).toUpperCase()}
        </div>
      </div>
    </header>
  );
}
