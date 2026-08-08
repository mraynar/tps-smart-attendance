"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import Modal from "@/components/ui/Modal";
import StatusBadge from "@/components/ui/StatusBadge";
import SearchBar from "@/components/ui/SearchBar";
import DataTable, { type Column } from "@/components/ui/DataTable";
import EmptyState from "@/components/ui/EmptyState";
import { Truck, Plus, AlertCircle, CheckCircle2 } from "lucide-react";

interface Vehicle {
  id: string;
  plate_number: string;
  vehicle_type: "truck" | "car" | "motorcycle" | "other";
  owner_company: string | null;
  is_active: boolean;
  created_at: string;
  detection_count?: number;
}

export default function VehiclesPage() {
  const supabase = createClient();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);

  // Form
  const [plateNumber, setPlateNumber] = useState("");
  const [vehicleType, setVehicleType] = useState<Vehicle["vehicle_type"]>("truck");
  const [ownerCompany, setOwnerCompany] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from("vehicles")
      .select("id, plate_number, vehicle_type, owner_company, is_active, created_at")
      .is("deleted_at", null)
      .order("created_at", { ascending: false });

    if (!data) { setLoading(false); return; }

    // Fetch detection counts per vehicle
    const ids = data.map((v) => v.id);
    const { data: counts } = await supabase
      .from("plate_detection_logs")
      .select("vehicle_id")
      .in("vehicle_id", ids);

    const countMap: Record<string, number> = {};
    (counts ?? []).forEach((r: any) => {
      countMap[r.vehicle_id] = (countMap[r.vehicle_id] ?? 0) + 1;
    });

    setVehicles(data.map((v) => ({ ...v, detection_count: countMap[v.id] ?? 0 })));
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  function resetForm() {
    setPlateNumber(""); setVehicleType("truck"); setOwnerCompany("");
    setFormError(null); setFormSuccess(false);
  }

  function openModal() { resetForm(); setModalOpen(true); }
  function closeModal() { setModalOpen(false); resetForm(); }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    const plate = plateNumber.trim().toUpperCase().replace(/\s/g, "");
    if (!plate) { setFormError("Nomor plat wajib diisi."); return; }
    setSubmitting(true);

    const { error } = await supabase.from("vehicles").insert({
      plate_number: plate,
      vehicle_type: vehicleType,
      owner_company: ownerCompany.trim() || null,
    });

    if (error) {
      if (error.code === "23505") {
        setFormError("Nomor plat sudah terdaftar. Gunakan nomor lain.");
      } else {
        setFormError("Gagal menyimpan. Pastikan Anda memiliki izin yang cukup (baris profiles wajib ada).");
      }
      setSubmitting(false);
      return;
    }

    setFormSuccess(true);
    await load();
    setTimeout(() => closeModal(), 1500);
    setSubmitting(false);
  }

  const filtered = vehicles.filter((v) =>
    !search ||
    v.plate_number.toLowerCase().includes(search.toLowerCase()) ||
    v.owner_company?.toLowerCase().includes(search.toLowerCase())
  );

  const columns: Column<Vehicle>[] = [
    {
      key: "plate", header: "Nomor Plat",
      render: (v) => (
        <span style={{
          display: "inline-block",
          fontWeight: 800,
          fontFamily: "monospace",
          fontSize: 13.5,
          letterSpacing: 1.5,
          background: "linear-gradient(180deg, #1E293B 0%, #0F172A 100%)",
          color: "#F8FAFC",
          padding: "3px 10px",
          borderRadius: 6,
          border: "1px solid #334155",
          boxShadow: "0 1px 2px rgba(0,0,0,0.1)",
        }}>
          {v.plate_number}
        </span>
      ),
    },
    { key: "type", header: "Kategori Kendaraan", render: (v) => <StatusBadge variant={v.vehicle_type} /> },
    { key: "company", header: "Perusahaan Pemilik", render: (v) => <span style={{ fontSize: 13.5, fontWeight: 500, color: "var(--color-text-dark)" }}>{v.owner_company ?? "–"}</span> },
    {
      key: "detections", header: "Frekuensi Deteksi",
      render: (v) => (
        <span style={{
          fontWeight: 700, fontSize: 12.5,
          padding: "3px 10px", borderRadius: 999,
          background: (v.detection_count ?? 0) > 0 ? "var(--color-primary-soft)" : "rgba(107, 114, 128, 0.1)",
          color: (v.detection_count ?? 0) > 0 ? "var(--color-primary)" : "var(--color-text-muted)",
        }}>
          {v.detection_count ?? 0} kali
        </span>
      ),
    },
    { key: "status", header: "Status", render: (v) => <StatusBadge variant={v.is_active ? "active" : "inactive"} /> },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: "var(--color-text-dark)", marginBottom: 4, letterSpacing: "-0.3px" }}>
            Manajemen Kendaraan
          </h1>
          <p style={{ fontSize: 14, color: "var(--color-text-muted)", fontWeight: 500 }}>
            {loading ? "Memuat data..." : `${vehicles.length} kendaraan operasional terdaftar`}
          </p>
        </div>
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <SearchBar id="vehicles-search" value={search} onChange={setSearch} placeholder="Cari plat atau perusahaan..." />
          <button id="btn-add-vehicle" onClick={openModal} className="btn-primary">
            <Plus size={16} /> Tambah
          </button>
        </div>
      </div>

      <div className="card" style={{
        padding: 0,
        overflow: "hidden",
        border: "1px solid rgba(229, 231, 235, 0.6)",
        boxShadow: "0 1px 3px rgba(11,63,107,0.02), 0 4px 16px rgba(11,63,107,0.03)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "16px 20px", borderBottom: "1px solid rgba(229, 231, 235, 0.6)", background: "#fff" }}>
          <div style={{
            width: 32, height: 32, borderRadius: 8,
            background: "#FEF3C7",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <Truck size={16} style={{ color: "#B45309" }} />
          </div>
          <span style={{ fontWeight: 700, fontSize: 15, color: "var(--color-text-dark)" }}>Daftar Kendaraan & Truk Logistik</span>
        </div>
        {filtered.length === 0 && !loading ? (
          <EmptyState icon={Truck}
            title="Tidak ada kendaraan"
            description={search ? "Coba kata kunci lain." : "Belum ada kendaraan terdaftar."}
            action={!search && <button onClick={openModal} className="btn-primary"><Plus size={16} /> Tambah Kendaraan</button>}
          />
        ) : (
          <DataTable columns={columns} data={filtered} loading={loading} keyField="id"
            emptyTitle="Tidak ada kendaraan" />
        )}
      </div>

      <Modal open={modalOpen} onClose={closeModal} title="Tambah Kendaraan"
        footer={!formSuccess ? (
          <>
            <button onClick={closeModal} className="btn-secondary">Batal</button>
            <button id="btn-submit-vehicle" form="vehicle-form" type="submit" className="btn-primary"
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
            <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>Kendaraan Ditambahkan!</div>
          </div>
        ) : (
          <form id="vehicle-form" onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            <div>
              <label htmlFor="v-plate" className="form-label">
                Nomor Plat <span style={{ color: "var(--color-danger)" }}>*</span>
                <span style={{ fontWeight: 400, fontSize: 12, color: "var(--color-text-muted)", marginLeft: 6 }}>
                  (akan dinormalisasi: huruf besar, tanpa spasi)
                </span>
              </label>
              <input id="v-plate" className="input-field" placeholder="Contoh: B1234ABC"
                value={plateNumber} onChange={e => setPlateNumber(e.target.value)} required />
            </div>

            <div>
              <label htmlFor="v-type" className="form-label">Tipe Kendaraan</label>
              <select id="v-type" className="input-field" value={vehicleType} onChange={e => setVehicleType(e.target.value as any)}>
                <option value="truck">Truk</option>
                <option value="car">Mobil</option>
                <option value="motorcycle">Motor</option>
                <option value="other">Lainnya</option>
              </select>
            </div>

            <div>
              <label htmlFor="v-company" className="form-label">Perusahaan Pemilik</label>
              <input id="v-company" className="input-field" placeholder="Nama perusahaan ekspedisi"
                value={ownerCompany} onChange={e => setOwnerCompany(e.target.value)} />
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
