"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import Modal from "@/components/ui/Modal";
import StatusBadge from "@/components/ui/StatusBadge";
import SearchBar from "@/components/ui/SearchBar";
import EmptyState from "@/components/ui/EmptyState";
import { Camera, Plus, AlertCircle, CheckCircle2, MapPin, Link2 } from "lucide-react";

interface Site {
  id: string;
  name: string;
}

interface CameraRow {
  id: string;
  name: string;
  purpose: "face_recognition" | "plate_detection" | "both";
  stream_url: string | null;
  is_active: boolean;
  site_id: string;
  sites: { name: string } | null;
}

const PURPOSE_LABELS: Record<string, string> = {
  face_recognition: "Absensi Wajah",
  plate_detection: "Deteksi Plat",
  both: "Absensi & Plat",
};

export default function CamerasPage() {
  const supabase = createClient();
  const [cameras, setCameras] = useState<CameraRow[]>([]);
  const [sites, setSites] = useState<Site[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [siteFilter, setSiteFilter] = useState("");
  const [modalOpen, setModalOpen] = useState(false);

  // Form
  const [camName, setCamName] = useState("");
  const [camPurpose, setCamPurpose] = useState<CameraRow["purpose"]>("face_recognition");
  const [camSite, setCamSite] = useState("");
  const [camUrl, setCamUrl] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const [camRes, siteRes] = await Promise.all([
      supabase.from("cameras").select("id, name, purpose, stream_url, is_active, site_id, sites(name)")
        .is("deleted_at", null).order("created_at", { ascending: false }),
      supabase.from("sites").select("id, name").is("deleted_at", null).order("name"),
    ]);
    setCameras((camRes.data as unknown as CameraRow[]) ?? []);

    setSites(siteRes.data ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  function resetForm() {
    setCamName(""); setCamPurpose("face_recognition"); setCamSite(""); setCamUrl("");
    setFormError(null); setFormSuccess(false);
  }
  function openModal() { resetForm(); if (sites.length > 0) setCamSite(sites[0].id); setModalOpen(true); }
  function closeModal() { setModalOpen(false); resetForm(); }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    if (!camName.trim()) { setFormError("Nama kamera wajib diisi."); return; }
    if (!camSite) { setFormError("Lokasi (site) wajib dipilih."); return; }
    setSubmitting(true);

    const { error } = await supabase.from("cameras").insert({
      name: camName.trim(),
      purpose: camPurpose,
      site_id: camSite,
      stream_url: camUrl.trim() || null,
      is_active: true,
    });

    if (error) {
      setFormError("Gagal menyimpan. Pastikan Anda memiliki izin yang cukup.");
      setSubmitting(false);
      return;
    }
    setFormSuccess(true);
    await load();
    setTimeout(() => closeModal(), 1500);
    setSubmitting(false);
  }

  async function toggleActive(cam: CameraRow) {
    await supabase.from("cameras").update({ is_active: !cam.is_active }).eq("id", cam.id);
    setCameras(prev => prev.map(c => c.id === cam.id ? { ...c, is_active: !c.is_active } : c));
  }

  const filtered = cameras.filter((c) => {
    const matchSearch = !search ||
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.sites?.name?.toLowerCase().includes(search.toLowerCase());
    const matchSite = !siteFilter || c.site_id === siteFilter;
    return matchSearch && matchSite;
  });

  // Group by site for display
  const grouped = sites.reduce<Record<string, CameraRow[]>>((acc, site) => {
    acc[site.id] = filtered.filter(c => c.site_id === site.id);
    return acc;
  }, {});
  const ungrouped = filtered.filter(c => !sites.find(s => s.id === c.site_id));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: "var(--color-text-dark)", marginBottom: 4, letterSpacing: "-0.3px" }}>
            Manajemen Kamera
          </h1>
          <p style={{ fontSize: 14, color: "var(--color-text-muted)" }}>
            {loading ? "Memuat..." : `${cameras.length} kamera di ${sites.length} lokasi`}
          </p>
        </div>
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <SearchBar id="cameras-search" value={search} onChange={setSearch} placeholder="Cari kamera atau lokasi..." />
          <button id="btn-add-camera" onClick={openModal} className="btn-primary">
            <Plus size={16} /> Tambah
          </button>
        </div>
      </div>

      {/* Site filter pills */}
      {sites.length > 0 && (
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {[{ id: "", name: "Semua Lokasi" }, ...sites].map((s) => (
            <button key={s.id} onClick={() => setSiteFilter(s.id)}
              style={{
                padding: "7px 18px", borderRadius: 999, border: "1.5px solid",
                cursor: "pointer", fontWeight: 700, fontSize: 13, transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
                borderColor: siteFilter === s.id ? "var(--color-primary)" : "rgba(229, 231, 235, 0.8)",
                background: siteFilter === s.id ? "var(--color-primary)" : "#fff",
                color: siteFilter === s.id ? "#fff" : "var(--color-text-muted)",
                boxShadow: siteFilter === s.id ? "0 2px 8px rgba(0, 114, 188, 0.25)" : "0 1px 2px rgba(0,0,0,0.02)",
              }}>
              {s.name}
            </button>
          ))}
        </div>
      )}

      {/* Camera cards grouped by site */}
      {loading ? (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16 }}>
          {[...Array(4)].map((_, i) => <div key={i} className="card skeleton" style={{ height: 140, border: "1px solid rgba(229, 231, 235, 0.5)" }} />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="card" style={{ border: "1px solid rgba(229, 231, 235, 0.6)" }}>
          <EmptyState icon={Camera} title="Tidak ada kamera"
            description={search ? "Coba kata kunci lain." : "Belum ada kamera terdaftar."}
            action={!search && <button onClick={openModal} className="btn-primary"><Plus size={16} /> Tambah Kamera</button>} />
        </div>
      ) : (
        <>
          {[...sites.filter(s => (grouped[s.id]?.length ?? 0) > 0), ...( ungrouped.length ? [{ id: "ungrouped", name: "Lokasi Tidak Diketahui" }] : [])].map((site) => {
            const cams = site.id === "ungrouped" ? ungrouped : (grouped[site.id] ?? []);
            if (!cams.length) return null;
            return (
              <div key={site.id} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, paddingLeft: 2 }}>
                  <div style={{
                    width: 26, height: 26, borderRadius: 6,
                    background: "var(--color-primary-soft)",
                    display: "flex", alignItems: "center", justifyContent: "center"
                  }}>
                    <MapPin size={14} style={{ color: "var(--color-primary)" }} />
                  </div>
                  <span style={{ fontWeight: 800, fontSize: 16, color: "var(--color-text-dark)", letterSpacing: "-0.2px" }}>{site.name}</span>
                  <span style={{
                    fontSize: 12, fontWeight: 700,
                    color: "var(--color-text-muted)",
                    background: "rgba(107, 114, 128, 0.1)",
                    padding: "2px 8px", borderRadius: 999,
                  }}>
                    {cams.length} unit
                  </span>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16 }}>
                  {cams.map((cam) => (
                    <div key={cam.id} className="card animate-fade-in-up"
                      style={{
                        padding: 18,
                        display: "flex", flexDirection: "column", justifyContent: "space-between",
                        border: "1px solid rgba(229, 231, 235, 0.6)",
                        boxShadow: "0 1px 3px rgba(11,63,107,0.02), 0 4px 12px rgba(11,63,107,0.02)",
                        transition: "all 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = "translateY(-3px)";
                        e.currentTarget.style.boxShadow = "0 8px 24px rgba(11,63,107,0.06)";
                        e.currentTarget.style.borderColor = "rgba(0, 114, 188, 0.2)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = "translateY(0)";
                        e.currentTarget.style.boxShadow = "0 1px 3px rgba(11,63,107,0.02), 0 4px 12px rgba(11,63,107,0.02)";
                        e.currentTarget.style.borderColor = "rgba(229, 231, 235, 0.6)";
                      }}
                    >
                      <div>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                            <div style={{
                              width: 38, height: 38, borderRadius: 10, flexShrink: 0,
                              background: cam.is_active ? "var(--color-primary-soft)" : "var(--color-neutral-bg)",
                              display: "flex", alignItems: "center", justifyContent: "center",
                              border: "1px solid rgba(229, 231, 235, 0.5)",
                            }}>
                              <Camera size={18} style={{ color: cam.is_active ? "var(--color-primary)" : "var(--color-text-muted)" }} />
                            </div>
                            <div>
                              <div style={{ fontWeight: 700, fontSize: 14.5, color: "var(--color-text-dark)" }}>{cam.name}</div>
                              <div style={{ fontSize: 12, color: "var(--color-text-muted)", marginTop: 2, fontWeight: 500 }}>
                                {PURPOSE_LABELS[cam.purpose] ?? cam.purpose}
                              </div>
                            </div>
                          </div>
                          <StatusBadge variant={cam.is_active ? "active" : "inactive"} size="sm" />
                        </div>

                        {cam.stream_url && (
                          <div style={{
                            fontSize: 11.5, fontFamily: "monospace", color: "var(--color-text-muted)",
                            marginBottom: 14, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                            display: "flex", alignItems: "center", gap: 6,
                            background: "var(--color-neutral-bg)", padding: "6px 10px", borderRadius: 8,
                            border: "1px solid rgba(229, 231, 235, 0.6)",
                          }}
                            title={cam.stream_url}>
                            <Link2 size={13} style={{ flexShrink: 0, color: "var(--color-primary-light)" }} />
                            <span style={{ overflow: "hidden", textOverflow: "ellipsis" }}>{cam.stream_url}</span>
                          </div>
                        )}
                      </div>

                      <button
                        onClick={() => toggleActive(cam)}
                        style={{
                          width: "100%", padding: "8px 0", borderRadius: 8, border: "1.5px solid",
                          cursor: "pointer", fontWeight: 700, fontSize: 12.5, transition: "all 0.15s",
                          borderColor: cam.is_active ? "#FECACA" : "#BBF7D0",
                          background: cam.is_active ? "#FEF2F2" : "#F0FDF4",
                          color: cam.is_active ? "var(--color-danger)" : "var(--color-success)",
                        }}
                      >
                        {cam.is_active ? "Nonaktifkan Kamera" : "Aktifkan Kamera"}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </>
      )}

      <Modal open={modalOpen} onClose={closeModal} title="Tambah Kamera"
        footer={!formSuccess ? (
          <>
            <button onClick={closeModal} className="btn-secondary">Batal</button>
            <button id="btn-submit-camera" form="camera-form" type="submit" className="btn-primary"
              disabled={submitting} style={{ opacity: submitting ? 0.7 : 1 }}>
              {submitting ? "Menyimpan..." : <><Plus size={16} /> Simpan</>}
            </button>
          </>
        ) : undefined}>
        {formSuccess ? (
          <div style={{ textAlign: "center", padding: "24px 0" }}>
            <div style={{ width: 64, height: 64, borderRadius: "50%", background: "#DCFCE7",
              display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
              <CheckCircle2 size={32} style={{ color: "var(--color-success)" }} />
            </div>
            <div style={{ fontSize: 18, fontWeight: 700 }}>Kamera Ditambahkan!</div>
          </div>
        ) : (
          <form id="camera-form" onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            <div>
              <label htmlFor="cam-name" className="form-label">
                Nama Kamera <span style={{ color: "var(--color-danger)" }}>*</span>
              </label>
              <input id="cam-name" className="input-field" placeholder="Contoh: CAM-GERBANG-01"
                value={camName} onChange={e => setCamName(e.target.value)} required />
            </div>

            <div>
              <label htmlFor="cam-site" className="form-label">
                Lokasi (Site) <span style={{ color: "var(--color-danger)" }}>*</span>
              </label>
              {sites.length === 0 ? (
                <div style={{ padding: "10px 14px", background: "#FEF3C7", borderRadius: 10, fontSize: 13, color: "#92400E" }}>
                  Belum ada site terdaftar. Tambahkan site terlebih dahulu via Supabase Studio.
                </div>
              ) : (
                <select id="cam-site" className="input-field" value={camSite} onChange={e => setCamSite(e.target.value)} required>
                  <option value="">Pilih lokasi...</option>
                  {sites.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              )}
            </div>

            <div>
              <label htmlFor="cam-purpose" className="form-label">Fungsi Kamera</label>
              <select id="cam-purpose" className="input-field" value={camPurpose} onChange={e => setCamPurpose(e.target.value as any)}>
                <option value="face_recognition">Absensi Wajah</option>
                <option value="plate_detection">Deteksi Plat</option>
                <option value="both">Absensi & Plat</option>
              </select>
            </div>

            <div>
              <label htmlFor="cam-url" className="form-label">Stream URL</label>
              <input id="cam-url" className="input-field" placeholder="rtsp://... atau identifier lokal"
                value={camUrl} onChange={e => setCamUrl(e.target.value)} />
            </div>

            {formError && (
              <div style={{ display: "flex", gap: 10, alignItems: "flex-start",
                padding: "12px 16px", background: "#FEF2F2", border: "1px solid #FECACA",
                borderRadius: 12, color: "var(--color-danger)", fontSize: 14 }}>
                <AlertCircle size={16} style={{ flexShrink: 0, marginTop: 1 }} />
                {formError}
              </div>
            )}
          </form>
        )}
      </Modal>
    </div>
  );
}
