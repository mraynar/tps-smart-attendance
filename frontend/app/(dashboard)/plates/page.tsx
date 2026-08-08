"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import DataTable, { type Column } from "@/components/ui/DataTable";
import FilterBar, { DateRangePicker, SelectFilter } from "@/components/ui/FilterBar";
import SearchBar from "@/components/ui/SearchBar";
import Link from "next/link";
import { CarFront, ChevronLeft, ChevronRight, ExternalLink } from "lucide-react";

interface PlateRow {
  id: string;
  detected_at: string;
  raw_ocr_text: string | null;
  cleaned_plate_text: string | null;
  detection_confidence: number | null;
  captured_image_url: string | null;
  vehicle_id: string | null;
  cameras: { name: string } | null;
}

const PAGE_SIZE = 20;

function fmtConf(v: number | null) {
  return v != null ? (v * 100).toFixed(1) + "%" : "–";
}
function fmtDT(s: string) {
  return new Date(s).toLocaleString("id-ID", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

export default function PlatesPage() {
  const supabase = createClient();
  const [data, setData] = useState<PlateRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
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
      .from("plate_detection_logs")
      .select(
        "id, detected_at, raw_ocr_text, cleaned_plate_text, detection_confidence, captured_image_url, vehicle_id, cameras(name)",
        { count: "exact" }
      )
      .gte("detected_at", `${startDate}T00:00:00`)
      .lte("detected_at", `${endDate}T23:59:59`)
      .order("detected_at", { ascending: false })
      .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);

    if (cameraFilter) q = q.eq("camera_id", cameraFilter);

    const { data: rows, count } = await q;
    let filtered = (rows ?? []) as unknown as PlateRow[];

    if (search) {
      const s = search.toLowerCase();
      filtered = filtered.filter(
        (r) =>
          r.cleaned_plate_text?.toLowerCase().includes(s) ||
          r.raw_ocr_text?.toLowerCase().includes(s) ||
          r.cameras?.name?.toLowerCase().includes(s)
      );
    }
    setData(filtered);
    setTotal(count ?? 0);
    setLoading(false);
  }, [page, startDate, endDate, cameraFilter, search]);

  useEffect(() => { setPage(0); }, [startDate, endDate, cameraFilter, search]);
  useEffect(() => { fetch(); }, [fetch]);

  const columns: Column<PlateRow>[] = [
    {
      key: "plate", header: "Nomor Plat Kendaraan",
      render: (r) => (
        <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
          <span style={{
            display: "inline-block",
            fontWeight: 800,
            fontSize: 13,
            fontFamily: "monospace",
            letterSpacing: 1.5,
            background: "linear-gradient(180deg, #1E293B 0%, #0F172A 100%)",
            color: "#F8FAFC",
            padding: "3px 10px",
            borderRadius: 6,
            border: "1px solid #334155",
            width: "fit-content",
            boxShadow: "0 1px 2px rgba(0,0,0,0.1)",
          }}>
            {r.cleaned_plate_text ?? "–"}
          </span>
          {r.raw_ocr_text && r.raw_ocr_text !== r.cleaned_plate_text && (
            <div style={{ fontSize: 11, color: "var(--color-text-muted)", marginLeft: 2 }}>Raw OCR: {r.raw_ocr_text}</div>
          )}
        </div>
      ),
    },
    { key: "time", header: "Waktu Deteksi", render: (r) => <span style={{ fontSize: 13, fontWeight: 500, color: "var(--color-text-dark)" }}>{fmtDT(r.detected_at)}</span> },
    {
      key: "confidence", header: "Tingkat Akurasi",
      render: (r) => (
        <span style={{
          fontSize: 12, fontFamily: "monospace", fontWeight: 700,
          padding: "3px 8px", borderRadius: 6,
          background: (r.detection_confidence ?? 0) > 0.8 ? "rgba(34, 197, 94, 0.1)" : "rgba(245, 158, 11, 0.1)",
          color: (r.detection_confidence ?? 0) > 0.8 ? "var(--color-success)" : "var(--color-warning)",
        }}>
          {fmtConf(r.detection_confidence)}
        </span>
      )
    },
    { key: "camera", header: "Kamera / Titik Lokasi", render: (r) => <span style={{ fontSize: 13, color: "var(--color-text-dark)" }}>{r.cameras?.name ?? "–"}</span> },
    {
      key: "vehicle", header: "Status Kendaraan",
      render: (r) => r.vehicle_id ? (
        <Link href={`/vehicles?id=${r.vehicle_id}`}
          style={{
            display: "inline-flex", alignItems: "center", gap: 4,
            color: "var(--color-primary)", fontSize: 12, fontWeight: 700,
            textDecoration: "none", background: "var(--color-primary-soft)",
            padding: "3px 8px", borderRadius: 6,
          }}>
          Terdaftar <ExternalLink size={12} />
        </Link>
      ) : (
        <span style={{
          color: "var(--color-text-muted)", fontSize: 12, fontWeight: 500,
          background: "var(--color-neutral-bg)", padding: "3px 8px", borderRadius: 6,
        }}>
          Belum Terdaftar
        </span>
      ),
    },
  ];

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: "var(--color-text-dark)", marginBottom: 4, letterSpacing: "-0.3px" }}>
            Riwayat Deteksi Plat
          </h1>
          <p style={{ fontSize: 14, color: "var(--color-text-muted)", fontWeight: 500 }}>
            {loading ? "Memuat data..." : `${total} deteksi kendaraan ditemukan`}
          </p>
        </div>
        <SearchBar id="plates-search" value={search} onChange={setSearch} placeholder="Cari nomor plat atau kamera..." />
      </div>

      <FilterBar>
        <DateRangePicker idPrefix="pl" startDate={startDate} endDate={endDate}
          onStartChange={setStartDate} onEndChange={setEndDate} />
        <SelectFilter id="pl-camera" value={cameraFilter} onChange={setCameraFilter}
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
            background: "#EDE9FE",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <CarFront size={16} style={{ color: "#7C3AED" }} />
          </div>
          <span style={{ fontWeight: 700, fontSize: 15, color: "var(--color-text-dark)" }}>Log Deteksi Plat Nomor (ANPR)</span>
        </div>
        <DataTable
          columns={columns}
          data={data}
          loading={loading}
          keyField="id"
          emptyTitle="Tidak ada log deteksi plat"
          emptyDescription="Coba ubah filter tanggal atau kamera."
        />
        {totalPages > 1 && (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 12,
            padding: "14px 20px", borderTop: "1px solid rgba(229, 231, 235, 0.6)", background: "#FAFBFD" }}>
            <span style={{ fontSize: 13, color: "var(--color-text-muted)", fontWeight: 500 }}>
              Halaman {page + 1} dari {totalPages}
            </span>
            <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}
              style={{
                padding: "6px 12px", border: "1px solid rgba(229, 231, 235, 0.8)", borderRadius: 8,
                background: "#fff", cursor: page === 0 ? "not-allowed" : "pointer", opacity: page === 0 ? 0.4 : 1,
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
              <ChevronLeft size={16} />
            </button>
            <button onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1}
              style={{
                padding: "6px 12px", border: "1px solid rgba(229, 231, 235, 0.8)", borderRadius: 8,
                background: "#fff", cursor: page >= totalPages - 1 ? "not-allowed" : "pointer",
                opacity: page >= totalPages - 1 ? 0.4 : 1,
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
