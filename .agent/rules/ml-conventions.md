# ML Conventions

## Struktur Eksperimen
- Semua eksperimen/training jalan di folder `ml/<nama_modul>/runs/`
- Setiap run punya folder sendiri dengan timestamp, contoh:
  `runs/2026-07-15_facenet_v1/` berisi log, metrics, dan checkpoint model
- Model yang LOLOS evaluasi (akurasi/similarity threshold sesuai target) baru
  dipindah/disalin ke `model_archive/` dengan nama versi jelas,
  contoh: `model_archive/facenet_v1_acc0.94.h5`
- Backend/production HANYA memuat model dari `model_archive/`, tidak pernah
  langsung dari `runs/`

## Reproducibility
- Random seed selalu di-set eksplisit di setiap script training
- Setiap run dicatat: dataset yang dipakai, hyperparameter, hasil metrics
  (boleh dalam file `run_notes.md` sederhana per folder run)
- Preprocessing data harus deterministic dan terdokumentasi

## Data Sensitif
- JANGAN commit foto wajah asli / data biometrik ke git
- Dataset simulasi (foto dummy/publik seperti LFW) boleh disimpan lokal untuk
  development, tapi tetap masuk `.gitignore`
- Untuk integrasi ke data asli Pelindo nanti: akses via API terbatas, bukan
  copy file foto langsung ke folder project

## Evaluasi Model
- Setiap model baru wajib dibandingkan dengan model archive sebelumnya
  (kalau ada) sebelum menggantikannya di production
- Threshold similarity/confidence WAJIB didokumentasikan alasan pemilihannya,
  bukan angka sembarang
