# Project Context: PenjadwalanAnca

Aplikasi web penjadwalan akademik personal khusus untuk mahasiswa Universitas Brawijaya (UB). Aplikasi ini mengintegrasikan Google Classroom (tugas/coursework), SIAKAD/Brone UB (jadwal kuliah & nilai), dan Google Calendar (pengingat otomatis).

## Tech Stack
- **Frontend/Backend**: Next.js 14 (App Router) di dalam folder `web/`
- **Styling**: Tailwind CSS + shadcn/ui
- **Auth**: NextAuth.js v4 (Google OAuth Provider)
- **Database**: Supabase (PostgreSQL)
- **Deployment**: Vercel (dengan Vercel Cron Jobs)

## Current Progress & Implemented Features

1. **Database Schema (Supabase)**
   - Menggunakan `public.users` yang menyimpan `email`, `google_id`, `google_refresh_token`, `brone_nim`, dan `brone_password_encrypted`.
   - Menggunakan ekstensi `pgcrypto` di PostgreSQL dengan RPC `set_brone_credentials` untuk mengenkripsi password Brone secara aman di level database.
   - Tabel pendukung: `courses`, `tasks`, `schedules`, `sync_logs`.

2. **Autentikasi (NextAuth)**
   - Menggunakan Google Provider dengan parameter `prompt: "consent", access_type: "offline"` untuk mendapatkan `refresh_token`.
   - Menambahkan scope tambahan untuk Classroom (`courses.readonly`, `coursework.me.readonly`) dan Calendar (`calendar.events`).
   - `callbacks.jwt` diatur untuk otomatis *upsert* data user dan *refresh token* ke Supabase setiap kali login.

3. **Google API Integrations (`web/lib/google/`)**
   - `classroom.ts`: Fungsi untuk menarik data *courses* dan *tasks* aktif dari Google Classroom menggunakan `googleapis` dan menyimpannya ke Supabase.
   - `calendar.ts`: Fungsi untuk membuat *event* tugas di Google Calendar beserta *reminder* (1 hari dan 2 jam sebelum *deadline*).

4. **Background Sync / Vercel Cron Jobs (`web/app/api/sync/`)**
   - `/api/sync/classroom/route.ts`: Endpoint cron yang melooping semua *user* dengan *refresh token*, menarik tugas baru dari Classroom secara otomatis, dan mencatatnya ke `sync_logs`.
   - `/api/sync/brone/route.ts`: Endpoint cron (saat ini masih berupa *stub*) yang disiapkan untuk *trigger* proses scraping Brone.

5. **Antarmuka Mobile-First**
   - `BottomNav.tsx`: Komponen navigasi bawah yang dirender di `layout.tsx`.
   - `/dashboard`: Menampilkan tugas terdekat dari database (`tasks` table) dan status sinkronisasi.
   - `/schedule`: Menampilkan jadwal harian dan menyediakan form untuk menambah jadwal *custom* (manual) ke database.
   - `/settings`: Form untuk menginput kredensial Brone (NIM & Password) yang akan langsung memanggil RPC Supabase untuk enkripsi data.

## Pending Tasks / Next Steps (Fokus Selanjutnya)

1. **Implementasi Scraper Brone UB**: Membuat *script* `puppeteer` atau `cheerio` (tergantung apakah Brone menggunakan SPA/JS rendering) untuk login menggunakan kredensial terdekripsi, mengambil data jadwal kuliah semester aktif, dan menyimpannya ke tabel `schedules`.
2. **Sinkronisasi Manual**: Menambahkan tombol di `/settings` atau `/dashboard` untuk memanggil *endpoint* sinkronisasi `/api/sync/classroom` secara manual (*on-demand*).
3. **Setup Kredensial GCP**: Konfigurasi OAuth Client ID & Secret di Google Cloud Console untuk environment lokal (`.env.local`), mengaktifkan Classroom & Calendar API, dan mendaftarkan aplikasi di mode *testing/production*.
