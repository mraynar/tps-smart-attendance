"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import DataTable, { type Column } from "@/components/ui/DataTable";
import StatusBadge from "@/components/ui/StatusBadge";
import FilterBar, { DateRangePicker, SelectFilter } from "@/components/ui/FilterBar";
import SearchBar from "@/components/ui/SearchBar";
import { UserCheck, ChevronLeft, ChevronRight, User } from "lucide-react";

interface AttendanceRow {
  id: string;
  detected_at: string;
  status: string;
  similarity_score: number | null;
  liveness_score: number | null;
  captured_image_url: string | null;
  persons: { full_name: string } | null;
  cameras: { name: string } | null;
}

const PAGE_SIZE = 20;

function fmtScore(v: number | null) {
  return v != null ? (v * 100).toFixed(1) + "%" : "–";
}
function fmtDT(s: string) {
  return new Date(s).toLocaleString("id-ID", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

export default function AttendancePage() {
  const supabase = createClient();
  const [data, setData] = useState<AttendanceRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [cameras, setCameras] = useState<{ value: string; label: string }[]>([]);
  const [cameraFilter, setCameraFilter] = useState("");
  const today = new Date().toISOString().split("T")[0];
  const [startDate, setStartDate] = useState(today);
  const [endDate, setEndDate] = useState(today);

  useEffect(() => {
    supabase.from("cameras").select("id, name").then(({ data }) => {
      if (data) setCameras(data.map((c) => ({ value: c.id, label: c.name })));
    });
  }, []);

  const fetch = useCallback(async () => {
    setLoading(true);
    let q = supabase
      .from("attendance_logs")
      .select(
        "id, detected_at, status, similarity_score, liveness_score, captured_image_url, persons(full_name), cameras(name)",
        { count: "exact" }
      )
      .gte("detected_at", `${startDate}T00:00:00`)
      .lte("detected_at", `${endDate}T23:59:59`)
      .order("detected_at", { ascending: false })
      .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);

    if (statusFilter) q = q.eq("status", statusFilter);
    if (cameraFilter) q = q.eq("camera_id", cameraFilter);

    const { data: rows, count } = await q;
    let filtered = (rows ?? []) as unknown as AttendanceRow[];

    if (search) {
      const s = search.toLowerCase();
      filtered = filtered.filter(
        (r) => r.persons?.full_name?.toLowerCase().includes(s) || r.cameras?.name?.toLowerCase().includes(s)
      );
    }
    setData(filtered);
    setTotal(count ?? 0);
    setLoading(false);
  }, [page, startDate, endDate, statusFilter, cameraFilter, search]);

  useEffect(() => { setPage(0); }, [startDate, endDate, statusFilter, cameraFilter, search]);
  useEffect(() => { fetch(); }, [fetch]);

  const columns: Column<AttendanceRow>[] = [
    {
      key: "photo", header: "Foto",
      render: (r) => r.captured_image_url ? (
        <img src={r.captured_image_url} alt="Capture"
          style={{ width: 40, height: 40, borderRadius: 8, objectFit: "cover", border: "1px solid rgba(229, 231, 235, 0.8)", boxShadow: "0 1px 2px rgba(0,0,0,0.04)" }} />
      ) : (
        <div style={{ width: 40, height: 40, borderRadius: 8, background: "var(--color-neutral-bg)",
          border: "1px solid rgba(229, 231, 235, 0.5)",
          display: "flex", alignItems: "center", justifyContent: "center" }}>
          <User size={18} style={{ color: "var(--color-text-muted)" }} />
        </div>
      ),
      width: "60px",
    },
    {
      key: "name", header: "Nama Pegawai / Sopir",
      render: (r) => (
        <div>
          <div style={{ fontWeight: 700, fontSize: 14, color: "var(--color-text-dark)" }}>{r.persons?.full_name ?? <em style={{ color: "var(--color-text-muted)", fontWeight: 400 }}>Tidak Dikenal</em>}</div>
          <div style={{ fontSize: 12, color: "var(--color-text-muted)", marginTop: 2, display: "flex", alignItems: "center", gap: 4 }}>
            <span>Kamera: {r.cameras?.name ?? "–"}</span>
          </div>
        </div>
      ),
    },
    { key: "time", header: "Waktu Absen", render: (r) => <span style={{ fontSize: 13, fontWeight: 500, color: "var(--color-text-dark)" }}>{fmtDT(r.detected_at)}</span> },
    { key: "status", header: "Status", render: (r) => <StatusBadge variant={r.status as any} /> },
    {
      key: "sim", header: "Similarity",
      render: (r) => (
        <span style={{
          fontSize: 12, fontFamily: "monospace", fontWeight: 700,
          padding: "3px 8px", borderRadius: 6,
          background: r.similarity_score && r.similarity_score >= 0.75 ? "rgba(34, 197, 94, 0.1)" : "rgba(107, 114, 128, 0.1)",
          color: r.similarity_score && r.similarity_score >= 0.75 ? "var(--color-success)" : "var(--color-text-muted)",
        }}>
          {fmtScore(r.similarity_score)}
        </span>
      )
    },
    {
      key: "live", header: "Liveness",
      render: (r) => (
        <span style={{
          fontSize: 12, fontFamily: "monospace", fontWeight: 700,
          padding: "3px 8px", borderRadius: 6,
          background: r.liveness_score && r.liveness_score >= 0.8 ? "rgba(0, 114, 188, 0.1)" : "rgba(107, 114, 128, 0.1)",
          color: r.liveness_score && r.liveness_score >= 0.8 ? "var(--color-primary)" : "var(--color-text-muted)",
        }}>
          {fmtScore(r.liveness_score)}
        </span>
      )
    },
  ];

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: "var(--color-text-dark)", marginBottom: 4, letterSpacing: "-0.3px" }}>
            Riwayat Absensi
          </h1>
          <p style={{ fontSize: 14, color: "var(--color-text-muted)", fontWeight: 500 }}>
            {loading ? "Memuat data..." : `${total} record absensi ditemukan`}
          </p>
        </div>
        <SearchBar id="att-search" value={search} onChange={setSearch} placeholder="Cari nama atau kamera..." />
      </div>

      <FilterBar>
        <DateRangePicker idPrefix="att" startDate={startDate} endDate={endDate}
          onStartChange={setStartDate} onEndChange={setEndDate} />
        <SelectFilter id="att-status" value={statusFilter} onChange={setStatusFilter}
          placeholder="Semua Status"
          options={[
            { value: "recognized", label: "Dikenali" },
            { value: "unrecognized", label: "Tidak Dikenal" },
            { value: "rejected_spoof", label: "Spoofing" },
          ]} />
        <SelectFilter id="att-camera" value={cameraFilter} onChange={setCameraFilter}
          placeholder="Semua Kamera" options={cameras} />
      </FilterBar>

      <div className="card" style={{
        padding: 0,
        overflow: "hidden",
        border: "1px solid rgba(229, 231, 235, 0.6)",
        boxShadow: "0 1px 3px rgba(11,63,107,0.02), 0 4px 16px rgba(11,63,107,0.03)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "16px 20px", borderBottom: "1px solid rgba(229, 231, 235, 0.6)", background: "#fff" }}>
          <div style={{
            width: 32, height: 32, borderRadius: 8,
            background: "var(--color-primary-soft)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <UserCheck size={16} style={{ color: "var(--color-primary)" }} />
          </div>
          <span style={{ fontWeight: 700, fontSize: 15, color: "var(--color-text-dark)" }}>Log Absensi Pegawai & Sopir</span>
        </div>
        <DataTable
          columns={columns}
          data={data}
          loading={loading}
          keyField="id"
          emptyTitle="Tidak ada log absensi"
          emptyDescription="Coba ubah filter tanggal atau status untuk melihat data."
        />

        {/* Pagination */}
        {totalPages > 1 && (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 12,
            padding: "14px 20px", borderTop: "1px solid rgba(229, 231, 235, 0.6)", background: "#FAFBFD" }}>
            <span style={{ fontSize: 13, color: "var(--color-text-muted)", fontWeight: 500 }}>
              Halaman {page + 1} dari {totalPages}
            </span>
            <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}
              style={{
                padding: "6px 12px", border: "1px solid rgba(229, 231, 235, 0.8)", borderRadius: 8,
                background: "#fff", cursor: page === 0 ? "not-allowed" : "pointer",
                opacity: page === 0 ? 0.4 : 1, transition: "all 0.15s",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
              <ChevronLeft size={16} />
            </button>
            <button onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1}
              style={{
                padding: "6px 12px", border: "1px solid rgba(229, 231, 235, 0.8)", borderRadius: 8,
                background: "#fff", cursor: page >= totalPages - 1 ? "not-allowed" : "pointer",
                opacity: page >= totalPages - 1 ? 0.4 : 1, transition: "all 0.15s",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
              <ChevronRight size={16} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
