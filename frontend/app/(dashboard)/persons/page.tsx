"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import Modal from "@/components/ui/Modal";
import StatusBadge from "@/components/ui/StatusBadge";
import SearchBar from "@/components/ui/SearchBar";
import EmptyState from "@/components/ui/EmptyState";
import {
  Users, Plus, Upload, X, User, Briefcase, Car, Truck,
  AlertCircle, CheckCircle2, Loader2
} from "lucide-react";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";

interface Person {
  id: string;
  full_name: string;
  person_type: "employee" | "driver";
  phone_number: string | null;
  photo_url: string | null;
  is_active: boolean;
  created_at: string;
  employee_details: { employee_id: string; department: string | null; position: string | null } | null;
  driver_details: { license_number: string | null; company_name: string | null } | null;
}

// Friendly error messages for known Postgres constraint codes
function friendlyError(detail: string): string {
  if (detail.includes("employee_details_employee_id_key") || detail.includes("employee_id") && detail.includes("already exists"))
    return "ID Pegawai sudah terdaftar. Gunakan ID lain.";
  if (detail.includes("license_number") && detail.includes("already exists"))
    return "Nomor SIM sudah terdaftar. Periksa kembali data sopir.";
  if (detail.includes("23505"))
    return "Data duplikat: ada nilai yang sudah digunakan sebelumnya.";
  if (detail.includes("Tidak ada foto valid"))
    return "Tidak ada wajah terdeteksi dari foto yang diunggah. Pastikan foto memperlihatkan wajah dengan jelas.";
  return detail;
}

export default function PersonsPage() {
  const supabase = createClient();
  const [persons, setPersons] = useState<Person[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<"" | "employee" | "driver">("");
  const [modalOpen, setModalOpen] = useState(false);

  // Form state
  const [personType, setPersonType] = useState<"employee" | "driver">("employee");
  const [fullName, setFullName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [employeeId, setEmployeeId] = useState("");
  const [department, setDepartment] = useState("");
  const [position, setPosition] = useState("");
  const [licenseNumber, setLicenseNumber] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [companyPhone, setCompanyPhone] = useState("");
  const [images, setImages] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState(false);

  const loadPersons = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from("persons")
      .select(`
        id, full_name, person_type, phone_number, photo_url, is_active, created_at,
        employee_details(employee_id, department, position),
        driver_details(license_number, company_name)
      `)
      .is("deleted_at", null)
      .order("created_at", { ascending: false });
    setPersons((data as unknown as Person[]) ?? []);

    setLoading(false);
  }, []);

  useEffect(() => { loadPersons(); }, [loadPersons]);

  function resetForm() {
    setPersonType("employee");
    setFullName(""); setPhoneNumber(""); setEmployeeId("");
    setDepartment(""); setPosition(""); setLicenseNumber("");
    setCompanyName(""); setCompanyPhone(""); setImages([]);
    setFormError(null); setFormSuccess(false);
  }

  function openModal() { resetForm(); setModalOpen(true); }
  function closeModal() { setModalOpen(false); resetForm(); }

  function handleFiles(files: FileList | null) {
    if (!files) return;
    setImages(prev => [...prev, ...Array.from(files)]);
  }

  function removeImage(idx: number) {
    setImages(prev => prev.filter((_, i) => i !== idx));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);

    if (!fullName.trim()) { setFormError("Nama lengkap wajib diisi."); return; }
    if (personType === "employee" && !employeeId.trim()) { setFormError("ID Pegawai wajib diisi."); return; }
    if (images.length === 0) { setFormError("Minimal 1 foto wajah wajib diunggah."); return; }

    setSubmitting(true);

    const formData = new FormData();
    formData.append("person_type", personType);
    formData.append("full_name", fullName.trim());
    if (phoneNumber) formData.append("phone_number", phoneNumber.trim());

    if (personType === "employee") {
      formData.append("employee_id", employeeId.trim());
      if (department) formData.append("department", department.trim());
      if (position) formData.append("position", position.trim());
    } else {
      if (licenseNumber) formData.append("license_number", licenseNumber.trim());
      if (companyName) formData.append("company_name", companyName.trim());
      if (companyPhone) formData.append("company_phone", companyPhone.trim());
    }

    // Append each image under the field name "images" (repeated)
    images.forEach((img) => formData.append("images", img));

    try {
      const res = await fetch(`${API_BASE}/api/enroll`, {
        method: "POST",
        body: formData,
      });

      const json = await res.json();

      if (!res.ok) {
        // res.status 400 → friendly message; 500 → generic
        const detail = typeof json.detail === "string" ? json.detail : JSON.stringify(json.detail);
        setFormError(res.status === 400 ? friendlyError(detail) : "Terjadi kesalahan server. Coba lagi.");
        setSubmitting(false);
        return;
      }

      setFormSuccess(true);
      await loadPersons();
      setTimeout(() => closeModal(), 1600);
    } catch {
      setFormError("Tidak dapat terhubung ke backend. Pastikan server berjalan di http://localhost:8000.");
    } finally {
      setSubmitting(false);
    }
  }

  const filtered = persons.filter((p) => {
    const matchSearch =
      !search ||
      p.full_name.toLowerCase().includes(search.toLowerCase()) ||
      p.employee_details?.employee_id?.toLowerCase().includes(search.toLowerCase()) ||
      p.driver_details?.company_name?.toLowerCase().includes(search.toLowerCase());
    const matchType = !typeFilter || p.person_type === typeFilter;
    return matchSearch && matchType;
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: "var(--color-text-dark)", marginBottom: 4, letterSpacing: "-0.3px" }}>
            Pegawai &amp; Sopir
          </h1>
          <p style={{ fontSize: 14, color: "var(--color-text-muted)" }}>
            {loading ? "Memuat..." : `${persons.length} orang terdaftar`}
          </p>
        </div>
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <SearchBar id="persons-search" value={search} onChange={setSearch} placeholder="Cari nama atau ID..." />
          <button id="btn-add-person" onClick={openModal} className="btn-primary">
            <Plus size={16} /> Tambah
          </button>
        </div>
      </div>

      {/* Type filter pills */}
      <div style={{ display: "flex", gap: 8 }}>
        {[
          { val: "", label: "Semua" },
          { val: "employee", label: "Pegawai" },
          { val: "driver", label: "Sopir" },
        ].map(({ val, label }) => (
          <button key={val}
            onClick={() => setTypeFilter(val as any)}
            style={{
              padding: "7px 20px", borderRadius: 999, border: "1.5px solid",
              cursor: "pointer", fontWeight: 700, fontSize: 13, transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
              borderColor: typeFilter === val ? "var(--color-primary)" : "rgba(229, 231, 235, 0.8)",
              background: typeFilter === val ? "var(--color-primary)" : "#fff",
              color: typeFilter === val ? "#fff" : "var(--color-text-muted)",
              boxShadow: typeFilter === val ? "0 2px 8px rgba(0, 114, 188, 0.25)" : "0 1px 2px rgba(0,0,0,0.02)",
            }}>
            {label}
          </button>
        ))}
      </div>

      {/* Grid list */}
      {loading ? (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(290px, 1fr))", gap: 16 }}>
          {[...Array(6)].map((_, i) => (
            <div key={i} className="card" style={{ display: "flex", gap: 14, alignItems: "center", border: "1px solid rgba(229, 231, 235, 0.5)" }}>
              <div className="skeleton" style={{ width: 52, height: 52, borderRadius: "50%" }} />
              <div style={{ flex: 1 }}>
                <div className="skeleton" style={{ height: 14, width: "70%", marginBottom: 8 }} />
                <div className="skeleton" style={{ height: 12, width: "50%" }} />
              </div>
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="card" style={{ border: "1px solid rgba(229, 231, 235, 0.6)" }}>
          <EmptyState
            icon={Users}
            title="Tidak ada orang ditemukan"
            description={search ? "Coba kata kunci lain." : "Belum ada pegawai atau sopir yang terdaftar."}
            action={!search && (
              <button onClick={openModal} className="btn-primary"><Plus size={16} /> Tambah Orang Baru</button>
            )}
          />
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(290px, 1fr))", gap: 16 }}>
          {filtered.map((p) => (
            <div key={p.id} className="card animate-fade-in-up"
              style={{
                display: "flex", gap: 14, alignItems: "flex-start",
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
              {/* Avatar */}
              <div style={{
                width: 52, height: 52, borderRadius: "50%", flexShrink: 0, overflow: "hidden",
                background: p.person_type === "employee"
                  ? "linear-gradient(135deg, var(--color-primary-soft), var(--color-primary-light))"
                  : "linear-gradient(135deg, #EDE9FE, #A78BFA)",
                display: "flex", alignItems: "center", justifyContent: "center",
                boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
                border: "2px solid #fff",
              }}>
                {p.photo_url ? (
                  <img src={p.photo_url} alt={p.full_name}
                    style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                ) : (
                  <User size={22} style={{ color: p.person_type === "employee" ? "var(--color-primary)" : "#7C3AED" }} />
                )}
              </div>

              {/* Info */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6, flexWrap: "wrap" }}>
                  <span style={{ fontWeight: 700, fontSize: 15, color: "var(--color-text-dark)" }}>
                    {p.full_name}
                  </span>
                  <StatusBadge variant={p.person_type} size="sm" />
                  {!p.is_active && <StatusBadge variant="inactive" size="sm" />}
                </div>

                {p.person_type === "employee" && p.employee_details && (
                  <div style={{ fontSize: 12, color: "var(--color-text-muted)", lineHeight: 1.7 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 5, fontWeight: 500 }}>
                      <Briefcase size={12} style={{ color: "var(--color-primary)" }} /> {p.employee_details.employee_id}
                    </div>
                    {p.employee_details.department && (
                      <div style={{ color: "var(--color-text-dark)", fontWeight: 500 }}>{p.employee_details.department} {p.employee_details.position ? `· ${p.employee_details.position}` : ""}</div>
                    )}
                  </div>
                )}
                {p.person_type === "driver" && p.driver_details && (
                  <div style={{ fontSize: 12, color: "var(--color-text-muted)", lineHeight: 1.7 }}>
                    {p.driver_details.company_name && (
                      <div style={{ display: "flex", alignItems: "center", gap: 5, color: "var(--color-text-dark)", fontWeight: 500 }}>
                        <Car size={12} style={{ color: "#7C3AED" }} /> {p.driver_details.company_name}
                      </div>
                    )}
                    {p.driver_details.license_number && <div>SIM: {p.driver_details.license_number}</div>}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Enrollment Modal */}
      <Modal
        open={modalOpen}
        onClose={closeModal}
        title="Daftarkan Orang Baru"
        maxWidth={560}
        footer={
          !formSuccess ? (
            <>
              <button onClick={closeModal} className="btn-secondary">Batal</button>
              <button
                id="btn-submit-enroll"
                form="enroll-form"
                type="submit"
                className="btn-primary"
                disabled={submitting}
                style={{ opacity: submitting ? 0.7 : 1, cursor: submitting ? "not-allowed" : "pointer" }}
              >
                {submitting ? (
                  <><Loader2 size={16} style={{ animation: "spin 0.8s linear infinite" }} /> Mendaftarkan...</>
                ) : (
                  <><Plus size={16} /> Daftarkan & Enrollment</>
                )}
              </button>
            </>
          ) : undefined
        }
      >
        {formSuccess ? (
          <div style={{ textAlign: "center", padding: "24px 0" }}>
            <div style={{ width: 64, height: 64, borderRadius: "50%", background: "#DCFCE7",
              display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
              <CheckCircle2 size={32} style={{ color: "var(--color-success)" }} />
            </div>
            <div style={{ fontSize: 18, fontWeight: 700, color: "var(--color-text-dark)", marginBottom: 8 }}>
              Enrollment Berhasil!
            </div>
            <div style={{ fontSize: 14, color: "var(--color-text-muted)" }}>
              Data dan face embedding telah disimpan.
            </div>
          </div>
        ) : (
          <form id="enroll-form" onSubmit={handleSubmit}
            style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            {/* Person type toggle */}
            <div>
              <label className="form-label">Tipe</label>
              <div style={{ display: "flex", gap: 8 }}>
                {(["employee", "driver"] as const).map((t) => (
                  <button key={t} type="button"
                    onClick={() => setPersonType(t)}
                    style={{
                      flex: 1, padding: "10px 0", borderRadius: 10, border: "1.5px solid",
                      cursor: "pointer", fontWeight: 600, fontSize: 14, transition: "all 0.15s",
                      borderColor: personType === t ? "var(--color-primary)" : "#E5E7EB",
                      background: personType === t ? "var(--color-primary-soft)" : "#fff",
                      color: personType === t ? "var(--color-primary)" : "var(--color-text-muted)",
                    }}>
                    <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                      {t === "employee" ? <User size={16} /> : <Truck size={16} />}
                      <span>{t === "employee" ? "Pegawai" : "Sopir"}</span>
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Common fields */}
            <div>
              <label htmlFor="enroll-name" className="form-label">Nama Lengkap <span style={{ color: "var(--color-danger)" }}>*</span></label>
              <input id="enroll-name" className="input-field" placeholder="Contoh: Budi Santoso"
                value={fullName} onChange={e => setFullName(e.target.value)} required />
            </div>

            <div>
              <label htmlFor="enroll-phone" className="form-label">Nomor HP</label>
              <input id="enroll-phone" className="input-field" placeholder="08xx-xxxx-xxxx" type="tel"
                value={phoneNumber} onChange={e => setPhoneNumber(e.target.value)} />
            </div>

            {/* Employee fields */}
            {personType === "employee" && (
              <>
                <div>
                  <label htmlFor="enroll-emp-id" className="form-label">
                    ID Pegawai (NIK/NIP) <span style={{ color: "var(--color-danger)" }}>*</span>
                  </label>
                  <input id="enroll-emp-id" className="input-field" placeholder="Contoh: EMP001"
                    value={employeeId} onChange={e => setEmployeeId(e.target.value)} required />
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <div>
                    <label htmlFor="enroll-dept" className="form-label">Departemen</label>
                    <input id="enroll-dept" className="input-field" placeholder="Contoh: Operasional"
                      value={department} onChange={e => setDepartment(e.target.value)} />
                  </div>
                  <div>
                    <label htmlFor="enroll-pos" className="form-label">Jabatan</label>
                    <input id="enroll-pos" className="input-field" placeholder="Contoh: Supervisor"
                      value={position} onChange={e => setPosition(e.target.value)} />
                  </div>
                </div>
              </>
            )}

            {/* Driver fields */}
            {personType === "driver" && (
              <>
                <div>
                  <label htmlFor="enroll-license" className="form-label">Nomor SIM</label>
                  <input id="enroll-license" className="input-field" placeholder="Contoh: 1234567890123456"
                    value={licenseNumber} onChange={e => setLicenseNumber(e.target.value)} />
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <div>
                    <label htmlFor="enroll-company" className="form-label">Perusahaan</label>
                    <input id="enroll-company" className="input-field" placeholder="Nama ekspedisi"
                      value={companyName} onChange={e => setCompanyName(e.target.value)} />
                  </div>
                  <div>
                    <label htmlFor="enroll-cotel" className="form-label">Telp Perusahaan</label>
                    <input id="enroll-cotel" className="input-field" placeholder="021-xxx-xxxx"
                      value={companyPhone} onChange={e => setCompanyPhone(e.target.value)} />
                  </div>
                </div>
              </>
            )}

            {/* Photo upload */}
            <div>
              <label className="form-label">
                Foto Wajah <span style={{ color: "var(--color-danger)" }}>*</span>
                <span style={{ fontWeight: 400, color: "var(--color-text-muted)", marginLeft: 6, fontSize: 12 }}>
                  (min. 1 foto, bisa lebih untuk akurasi lebih baik)
                </span>
              </label>

              {/* Drop zone */}
              <div
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => { e.preventDefault(); handleFiles(e.dataTransfer.files); }}
                style={{
                  border: "2px dashed #D1D5DB", borderRadius: 12, padding: "24px",
                  textAlign: "center", cursor: "pointer", transition: "all 0.15s",
                  background: images.length ? "var(--color-primary-soft)" : "#FAFAFA",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.borderColor = "var(--color-primary-light)")}
                onMouseLeave={(e) => (e.currentTarget.style.borderColor = "#D1D5DB")}
              >
                <Upload size={24} style={{ color: "var(--color-primary-light)", marginBottom: 8 }} />
                <div style={{ fontSize: 14, fontWeight: 600, color: "var(--color-text-dark)" }}>
                  Klik atau drag &amp; drop foto di sini
                </div>
                <div style={{ fontSize: 12, color: "var(--color-text-muted)", marginTop: 4 }}>
                  JPG, PNG, HEIC · Pastikan wajah tampak jelas di foto
                </div>
                <input
                  ref={fileInputRef} type="file" multiple accept="image/*"
                  onChange={(e) => handleFiles(e.target.files)}
                  style={{ display: "none" }}
                />
              </div>

              {/* Preview thumbnails */}
              {images.length > 0 && (
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 12 }}>
                  {images.map((img, idx) => (
                    <div key={idx} style={{ position: "relative" }}>
                      <img
                        src={URL.createObjectURL(img)}
                        alt={`Preview ${idx + 1}`}
                        style={{ width: 64, height: 64, borderRadius: 10, objectFit: "cover",
                          border: "2px solid var(--color-primary-light)" }}
                      />
                      <button type="button" onClick={() => removeImage(idx)}
                        style={{
                          position: "absolute", top: -6, right: -6,
                          width: 20, height: 20, borderRadius: "50%",
                          background: "var(--color-danger)", border: "none", cursor: "pointer",
                          display: "flex", alignItems: "center", justifyContent: "center",
                          color: "#fff",
                        }}>
                        <X size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Error message */}
            {formError && (
              <div style={{
                display: "flex", gap: 10, alignItems: "flex-start",
                padding: "12px 16px",
                background: "#FEF2F2", border: "1px solid #FECACA",
                borderRadius: 12, color: "var(--color-danger)", fontSize: 14,
              }}>
                <AlertCircle size={16} style={{ flexShrink: 0, marginTop: 1 }} />
                {formError}
              </div>
            )}
          </form>
        )}
      </Modal>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
