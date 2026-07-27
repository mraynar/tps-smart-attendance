# Security Rules

- Tidak ada API key, connection string, atau secret apapun yang di-hardcode di kode.
  Semua lewat environment variable (`.env`, tidak pernah di-commit)
- `.env.example` selalu diperbarui setiap ada variable baru, tapi TANPA nilai asli
- Row Level Security (RLS) Supabase WAJIB aktif di semua tabel yang berisi data
  pegawai (`profiles`, `face_embeddings`, `attendance_logs`)
- Endpoint yang menerima upload foto wajib validasi tipe file & ukuran maksimal
  sebelum diproses model ML
- Foto wajah dan data biometrik dianggap data pribadi sensitif (sesuai UU PDP) —
  akses ke foto asli dibatasi hanya untuk role Admin/HR
- Kalau agent menjalankan command di terminal (bash), jangan gunakan flag
  auto-approve/turbo untuk command yang bersifat destruktif (`rm -rf`, drop table, dsb)
  tanpa konfirmasi eksplisit dari user
