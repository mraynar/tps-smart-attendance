"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import StatCard from "@/components/ui/StatCard";
import TrendChart from "@/components/dashboard/TrendChart";
import RecentActivity from "@/components/dashboard/RecentActivity";
import { UserCheck, CarFront, Users, Truck } from "lucide-react";

interface Stats {
  attendanceToday: number;
  platesToday: number;
  vehicles: number;
  persons: number;
}

interface TrendPoint { date: string; attendance: number; plates: number; }
interface ActivityItem {
  id: string; type: "attendance" | "plate";
  timestamp: string; label: string; sublabel?: string; status?: string;
}

function getLast7Days() {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return d.toISOString().split("T")[0];
  });
}

function fmtDateShort(iso: string) {
  return new Date(iso).toLocaleDateString("id-ID", { day: "numeric", month: "short" });
}

export default function DashboardPage() {
  const supabase = createClient();
  const [stats, setStats] = useState<Stats>({ attendanceToday: 0, platesToday: 0, vehicles: 0, persons: 0 });
  const [trend, setTrend] = useState<TrendPoint[]>([]);
  const [activity, setActivity] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const today = new Date().toISOString().split("T")[0];
      const days = getLast7Days();

      const [attToday, plToday, vehiclesRes, personsRes, att7, pl7, recentAtt, recentPl] =
        await Promise.all([
          supabase.from("attendance_logs").select("id", { count: "exact", head: true })
            .gte("detected_at", `${today}T00:00:00`),
          supabase.from("plate_detection_logs").select("id", { count: "exact", head: true })
            .gte("detected_at", `${today}T00:00:00`),
          supabase.from("vehicles").select("id", { count: "exact", head: true })
            .is("deleted_at", null),
          supabase.from("persons").select("id", { count: "exact", head: true })
            .is("deleted_at", null),
          supabase.from("attendance_logs").select("detected_at")
            .gte("detected_at", `${days[0]}T00:00:00`),
          supabase.from("plate_detection_logs").select("detected_at")
            .gte("detected_at", `${days[0]}T00:00:00`),
          supabase.from("attendance_logs")
            .select("id, status, detected_at, persons(full_name), cameras(name)")
            .order("detected_at", { ascending: false }).limit(5),
          supabase.from("plate_detection_logs")
            .select("id, cleaned_plate_text, raw_ocr_text, detected_at, cameras(name)")
            .order("detected_at", { ascending: false }).limit(5),
        ]);

      setStats({
        attendanceToday: attToday.count ?? 0,
        platesToday: plToday.count ?? 0,
        vehicles: vehiclesRes.count ?? 0,
        persons: personsRes.count ?? 0,
      });

      // Build trend data by grouping on date
      const attByDay: Record<string, number> = {};
      const plByDay: Record<string, number> = {};
      days.forEach((d) => { attByDay[d] = 0; plByDay[d] = 0; });
      (att7.data ?? []).forEach((r) => {
        const d = r.detected_at.split("T")[0];
        if (attByDay[d] !== undefined) attByDay[d]++;
      });
      (pl7.data ?? []).forEach((r) => {
        const d = r.detected_at.split("T")[0];
        if (plByDay[d] !== undefined) plByDay[d]++;
      });
      setTrend(days.map((d) => ({ date: fmtDateShort(d), attendance: attByDay[d], plates: plByDay[d] })));

      // Merge activity
      const attItems: ActivityItem[] = (recentAtt.data ?? []).map((r: any) => ({
        id: `att-${r.id}`,
        type: "attendance",
        timestamp: r.detected_at,
        label: r.persons?.full_name ?? "Tidak Dikenal",
        sublabel: `Kamera: ${r.cameras?.name ?? "–"}`,
        status: r.status,
      }));
      const plItems: ActivityItem[] = (recentPl.data ?? []).map((r: any) => ({
        id: `pl-${r.id}`,
        type: "plate",
        timestamp: r.detected_at,
        label: r.cleaned_plate_text ?? r.raw_ocr_text ?? "–",
        sublabel: `Kamera: ${r.cameras?.name ?? "–"}`,
      }));
      const merged = [...attItems, ...plItems].sort(
        (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      ).slice(0, 10);
      setActivity(merged);
      setLoading(false);
    }
    load();
  }, []);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
      {/* Page title */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
        <div>
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 6,
            fontSize: 12, fontWeight: 700, color: "var(--color-primary)",
            background: "var(--color-primary-soft)", padding: "4px 10px", borderRadius: 6,
            marginBottom: 8, letterSpacing: "0.02em", textTransform: "uppercase"
          }}>
            Terminal Petikemas Surabaya · Monitoring Hub
          </div>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: "var(--color-text-dark)", marginBottom: 4, letterSpacing: "-0.5px" }}>
            Dashboard Overview
          </h1>
          <p style={{ fontSize: 14, color: "var(--color-text-muted)", fontWeight: 500 }}>
            Monitoring real-time aktivitas absensi wajah pegawai & deteksi plat kendaraan logistik
          </p>
        </div>
      </div>

      {/* Stat cards */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
        gap: 20,
      }}>
        <StatCard
          label="Absensi Hari Ini"
          value={stats.attendanceToday}
          icon={UserCheck}
          iconColor="var(--color-primary)"
          iconBg="var(--color-primary-soft)"
          loading={loading}
        />
        <StatCard
          label="Deteksi Plat Hari Ini"
          value={stats.platesToday}
          icon={CarFront}
          iconColor="#7C3AED"
          iconBg="#EDE9FE"
          loading={loading}
        />
        <StatCard
          label="Kendaraan Terdaftar"
          value={stats.vehicles}
          icon={Truck}
          iconColor="#B45309"
          iconBg="#FEF3C7"
          loading={loading}
        />
        <StatCard
          label="Pegawai & Sopir"
          value={stats.persons}
          icon={Users}
          iconColor="#0F766E"
          iconBg="#CCFBF1"
          loading={loading}
        />
      </div>

      {/* Chart + Activity */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "1fr 380px",
        gap: 24,
        alignItems: "start",
      }}>
        {/* Trend chart */}
        <div className="card" style={{
          border: "1px solid rgba(229, 231, 235, 0.6)",
          boxShadow: "0 1px 3px rgba(11,63,107,0.02), 0 4px 16px rgba(11,63,107,0.03)",
        }}>
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 16, fontWeight: 800, color: "var(--color-text-dark)", letterSpacing: "-0.2px" }}>
              Tren 7 Hari Terakhir
            </div>
            <div style={{ fontSize: 13, color: "var(--color-text-muted)", marginTop: 4, fontWeight: 500 }}>
              Statistik perbandingan absensi wajah dan deteksi plat harian
            </div>
          </div>
          <TrendChart data={trend} loading={loading} />
        </div>

        {/* Recent activity */}
        <div className="card" style={{
          minWidth: 0,
          border: "1px solid rgba(229, 231, 235, 0.6)",
          boxShadow: "0 1px 3px rgba(11,63,107,0.02), 0 4px 16px rgba(11,63,107,0.03)",
        }}>
          <div style={{ fontSize: 16, fontWeight: 800, color: "var(--color-text-dark)", marginBottom: 16, letterSpacing: "-0.2px" }}>
            Aktivitas Terbaru
          </div>
          <RecentActivity items={activity} loading={loading} />
        </div>
      </div>
    </div>
  );
}
