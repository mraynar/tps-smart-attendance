# AGENTS.md — TPS Smart Attendance

> File ini dibaca oleh semua AI coding agent (Antigravity, Claude Code, Cursor, dll)
> sebelum mengerjakan task apapun di repo ini. Anggap ini kontrak kerja, bukan saran.

## 1. Ringkasan Project

Sistem absensi berbasis **face verification** untuk pegawai/supir di lingkungan Pelindo,
dengan rencana pengembangan lanjutan berupa **deteksi plat nomor kendaraan** (truk) yang
melintas. Dibangun sebagai bagian dari program magang, dengan standar penataan kode
setara production meskipun dikembangkan dengan pendekatan AI-assisted.

**Stack:**
- Frontend: **Next.js** (App Router), Tailwind CSS
- Backend: **FastAPI** (Python)
- Database & Auth & Storage: **Supabase** (PostgreSQL terkelola, Supabase Auth, Supabase Storage)
- ML — Face Verification: DeepFace (backbone Facenet/ArcFace)
- ML — Plate Detection (tahap berikutnya): YOLO (deteksi lokasi plat) + OCR (EasyOCR/PaddleOCR)

## 2. Role AI Agents

Setiap agent HANYA bekerja di lingkup tanggung jawabnya. Jangan lintas batas tanpa
instruksi eksplisit dari user.

### Frontend Agent
- Lingkup: folder `frontend/` saja
- Tanggung jawab: UI/UX Next.js + Tailwind, konsumsi API dari backend, capture webcam
- Wajib pakai design token dari `.agent/rules/design-tokens.md` (palette Pelindo)
- DILARANG menulis logic ML atau query database langsung

### Backend Agent
- Lingkup: folder `backend/` saja
- Tanggung jawab: REST API (FastAPI), validasi request/response (Pydantic schemas),
  orkestrasi pemanggilan service ML, komunikasi ke Supabase
- Wajib modular: routes / services / models / schemas terpisah jelas
- DILARANG menaruh semua logic dalam satu file besar (lihat `.agent/rules/coding-style.md`)

### ML Agent
- Lingkup: folder `ml/` saja
- Tanggung jawab: eksperimen model, training, evaluasi, ekspor model final
- Wajib ikuti konvensi `runs/` vs `model_archive/` — lihat `.agent/rules/ml-conventions.md`
- Model yang sudah lolos evaluasi dipromosikan ke `model_archive/`, backend HANYA
  boleh memuat model dari `model_archive/`, tidak pernah dari `runs/`

### DB/Migration Agent
- Lingkup: folder `supabase/migrations/` saja
- Tanggung jawab: satu-satunya yang boleh mengubah skema database
- Setiap perubahan skema WAJIB berupa file migration baru, tidak pernah edit
  migration lama yang sudah di-apply
- DILARANG mengubah struktur schema `auth` bawaan Supabase

## 3. Role RBAC Aplikasi (User-Facing)

| Role | Akses |
|---|---|
| **Admin/HR** | Kelola data pegawai, lihat seluruh log absensi, kelola master data |
| **Supervisor** | Lihat laporan absensi tim/divisinya saja |
| **Pegawai/Supir** | Absen (verifikasi wajah), lihat riwayat absen milik sendiri |

Autentikasi menggunakan **Supabase Auth** (email + password). Role disimpan di tabel
`profiles` (lihat migration awal), dienforce lewat **Row Level Security (RLS)** Supabase,
bukan hanya divalidasi di frontend/backend.

## 4. Prinsip Umum

1. **Tidak ada restrukturisasi di tengah jalan.** Struktur folder di README ini final untuk
   fase awal. Kalau ada kebutuhan struktur baru, diskusikan dulu sebelum eksekusi.
2. **Setiap fitur baru = migration baru**, tidak pernah edit skema lewat dashboard Supabase
   secara manual tanpa tercatat di kode.
3. **Kredensial tidak pernah di-hardcode.** Semua secret lewat `.env` (lihat `.env.example`),
   dan `.env` selalu ada di `.gitignore`.
4. **Commit kecil dan jelas.** Satu task = satu tanggung jawab jelas per commit.
5. Rules detail per topik ada di `.agent/rules/`, workflow yang bisa dipanggil manual
   (`/nama-workflow`) ada di `.agent/workflows/`.
