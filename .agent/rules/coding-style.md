# Coding Style Rules

## Python (Backend & ML)
- Ikuti PEP 8, wajib type hints di semua function signature
- Docstring wajib untuk function yang lebih dari 5 baris
- Satu file backend maksimal ~200-300 baris. Kalau lebih, pecah ke module baru
- Struktur wajib: `routes/` (endpoint tipis, tidak ada logic berat) →
  `services/` (logic utama) → `models/` (ORM) → `schemas/` (Pydantic validation)
- Nama file/function pakai `snake_case`

## TypeScript / Next.js (Frontend)
- Komponen fungsional + hooks, tidak pakai class component
- Satu komponen = satu tanggung jawab. Kalau JSX > 150 baris, pecah komponen kecil
- Nama file komponen pakai `PascalCase`, nama function/variable `camelCase`
- Styling HANYA pakai Tailwind utility classes + token dari `design-tokens.md`,
  hindari inline style kecuali kondisi dinamis yang tidak bisa lewat Tailwind

## Umum
- Tidak ada "magic number" — gunakan konstanta bernama (misal `SIMILARITY_THRESHOLD = 0.6`)
- Semua endpoint API wajib punya response schema eksplisit (bukan `dict` bebas)
- Error handling eksplisit, tidak boleh `except: pass` diam-diam
