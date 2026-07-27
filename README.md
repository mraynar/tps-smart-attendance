# TPS Smart Attendance

Sistem absensi berbasis face verification untuk pegawai/supir, dengan rencana
pengembangan lanjutan deteksi plat nomor kendaraan. Dibangun sebagai proyek
magang dengan standar penataan setara production.

## Stack
- **Frontend:** Next.js + Tailwind CSS
- **Backend:** FastAPI (Python)
- **Database/Auth/Storage:** Supabase
- **ML:** DeepFace (face verification) → YOLO + OCR (plate detection, tahap berikutnya)

## Struktur Folder

```
.
├── AGENTS.md              # Rules utama untuk AI coding agents (baca ini dulu!)
├── .agent/
│   ├── rules/              # Rules detail per topik
│   └── workflows/          # Prosedur yang bisa dipanggil manual
├── supabase/
│   └── migrations/         # Skema database sebagai kode, bukan file .dump manual
├── frontend/                # Next.js app
├── backend/                 # FastAPI app
│   └── app/
│       ├── core/            # config, koneksi db
│       ├── api/routes/      # endpoint (tipis, tanpa logic berat)
│       ├── services/        # logic utama (termasuk panggil ML)
│       ├── models/          # ORM models
│       └── schemas/         # Pydantic request/response
└── ml/
    ├── face_recognition/
    │   ├── runs/             # log eksperimen training
    │   └── model_archive/    # model final yang lolos evaluasi
    ├── plate_detection/       # (tahap berikutnya)
    └── shared_utils/
```

## Setup Awal (Development Lokal)

1. Install [Supabase CLI](https://supabase.com/docs/guides/cli)
2. Copy `.env.example` ke `.env`, isi dengan kredensial Supabase project Anda
3. Setup Python Virtual Environment & Install Backend Dependencies:
   ```bash
   python -m venv venv
   source venv/bin/activate
   pip install -r backend/requirements.txt
   ```
4. Install Frontend Dependencies:
   ```bash
   cd frontend
   npm install
   cd ..
   ```
5. Jalankan Supabase lokal & Apply migration:
   ```bash
   supabase start
   supabase db push
   ```

## Menjalankan Aplikasi (Development)

### 1. Cara Rekomendasi (Single Command)
Kami menyediakan script single dev runner untuk mengorkestrasi semua service (Supabase, Backend, Frontend) dalam satu terminal:
```bash
./dev.sh
```
*Catatan: Menekan `Ctrl+C` sekali akan otomatis membersihkan seluruh proses background (termasuk menjalankan `supabase stop` di akhir).*

### 2. Cara Manual (Fallback)
Jika script `dev.sh` mengalami kendala, Anda dapat menjalankan service di 3 terminal terpisah secara manual:

- **Terminal 1: Supabase**
  ```bash
  supabase start
  ```
- **Terminal 2: Backend**
  ```bash
  source venv/bin/activate && cd backend && uvicorn app.main:app --reload
  ```
- **Terminal 3: Frontend**
  ```bash
  cd frontend && npm run dev
  ```

## Untuk Kontributor / AI Agents

**Baca `AGENTS.md` dan folder `.agent/rules/` sebelum mengerjakan apapun.**
Struktur ini sudah final untuk fase awal — jangan restrukturisasi folder di
tengah jalan tanpa diskusi dulu.
