# PenjadwalanAnca

Repo ini menyiapkan fondasi “gratis” untuk:
- Supabase (schema + RLS)
- GitHub Actions (cron) untuk sinkronisasi (Classroom/Brone) tanpa bergantung cron dari hosting web

## 1) Setup Supabase
1. Buat project Supabase.
2. Buka SQL Editor, jalankan file migration di folder `migrations/` sesuai urutan.
3. Pastikan Auth aktif (Email).

## 2) Setup Google Cloud (Classroom + Calendar)
1. Buat project di Google Cloud Console.
2. Enable API:
   - Google Classroom API
   - Google Calendar API
3. Buat OAuth Client:
   - Application type: Web
   - Authorized redirect URI: (nanti mengikuti domain web app kamu)
4. Pastikan refresh token bisa didapat (umumnya butuh consent prompt).

## 3) GitHub Actions Secrets
Tambahkan secrets di repo GitHub:
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `GOOGLE_CLIENT_ID` (opsional untuk tahap minimal)
- `GOOGLE_CLIENT_SECRET` (opsional untuk tahap minimal)
- `BRONE_ENC_KEY` (opsional untuk tahap minimal)

## 4) Menjalankan Cron Sync
Workflow ada di:
- `.github/workflows/sync-classroom.yml`
- `.github/workflows/sync-brone.yml`

Untuk tahap minimal, job akan menulis log ke tabel `sync_logs` sebagai bukti pipeline berjalan.

## 5) Next Step
- Tambahkan frontend (React/Next.js) untuk login dan tampilan dashboard.
- Implementasi sync Classroom dan scraping Brone di folder `scripts/`.

