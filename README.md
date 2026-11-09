# SHE Meeting — Backend

Backend Express.js + JavaScript dan driver MongoDB untuk aplikasi internal SHE Meeting. Folder docs/ merupakan sumber tunggal dokumen bersama frontend/backend.

Status: D0-01 sampai D0-03 selesai serta diuji lokal. Login/sesi/CSRF, seed akun/divisi dan 18 temuan dummy, baca akun admin dan dashboard ringkas tersedia. Daftar/mutasi/audit bisnis temuan, grafik/tren dashboard, mutasi admin, foto/PDF belum tersedia. Belum deployment.

## Menjalankan mandiri

Gunakan Node kompatibel (diuji 24.10.0; .nvmrc menargetkan LTS 26) dan mongod pada PATH.

```sh
npm ci
```

Terminal pertama:

```sh
npm run db:dev
```

Terminal kedua, buat akun dan temuan dummy lalu jalankan API:

```sh
npm run seed:demo
npm run dev
```

Seed hanya diizinkan pada MongoDB development loopback. Akun `camp`, `transport`, `ict`, `admin.ict` memakai sandi acak yang tersimpan di `.local/demo-accounts.json` (mode 0600; diabaikan Git). Buka file secara lokal untuk login; jangan kirim ke GitHub. Seed menambah 18 temuan sintetik (2 batal) untuk dashboard. Seed ulang mempertahankan akun/sandi/status/versi/tanggal/audit serta perubahan temuan yang sudah ada; hanya fixture yang belum ada ditambahkan. Jika file kredensial hilang, seed ulang tidak mereset sandi akun lama; endpoint reset masih tahap M-06.

API: http://127.0.0.1:4000. Script database memakai loopback port 27027 dan .local/mongodb di repo ini, terpisah dari database default; tanpa autentikasi khusus development dan bukan konfigurasi VPS. Untuk layout workspace induk yang sudah ada, tetap boleh memakai script dari folder induk; pilih salah satu instance port 27027, jangan menjalankan dua bersamaan.

Default tanpa .env sudah tersedia; jika perlu salin .env.example ke .env yang belum ada. Database default she_meeting_dev; test/demo harus memakai prefix sesuai lingkungan. Jangan menyimpan URI berpassword di source/log.

```sh
npm test
# Seluruh tes, setelah MongoDB khusus proyek aktif:
MONGODB_TEST_URI=mongodb://127.0.0.1:27027 npm test
```

Tanpa MONGODB_TEST_URI, 12 tes unit/fondasi/config dijalankan dan dua suite integrasi dilewati secara eksplisit. Dengan URI test, seluruh 37 tes berjalan pada database unik she_meeting_test_auth_<uuid> dan she_meeting_test_dashboard_<uuid>, lalu hanya database tersebut dihapus. DB development tidak dipakai sebagai fallback.

Startup mem-ping MongoDB dan menyiapkan indeks autentikasi/findings sebelum listen. Readiness internal jangan diteruskan reverse proxy internet. API anonim 401; akun divisi ditolak 403 dari /api/v1/admin/*; admin boleh GET /api/v1/admin/accounts (baca saja). Mutasi admin dan temuan belum tersedia. Login/mutasi harus mengirim Origin allowlist; setelah login mutasi juga wajib X-CSRF-Token dari login/me. Sesi beberapa perangkat didukung, logout mencabut sesi saat ini.

Cookie lokal she_session_dev (HttpOnly/SameSite=Lax, absolut 12 jam). Tambahkan COOKIE_SECURE=false hanya untuk lokal HTTP; APP_ENV=demo wajib Secure dan seluruh ALLOWED_ORIGINS HTTPS. Demo memakai __Host-she_session. trust proxy tetap false; konfigurasi proxy, cookie cross-subdomain HTTPS, Vercel/VPS harus diuji saat O-02. Jangan menaruh token atau sandi di localStorage.

## Dashboard ringkas

GET /api/v1/dashboard memerlukan sesi divisi/admin. Query hanya month=YYYY-MM dan responsibleDivisionIds=<ID dipisah koma, maksimal 50>. Default semua divisi dan bulan kalender APP_TIMEZONE. Snapshot semua tanggal; pilihan bulan hanya memengaruhi dua indikator masuk/selesai. Data batal tidak dihitung, temuan bersama tetap unik. Respons berisi snapshot/period/scope/asOf/today/timeZone/dataMode; kontrak lengkap di docs/API_CONTRACT.md. Tidak ada endpoint tulis temuan pada tahap ini.

Dashboard kosong sah mengembalikan nol; galat pembacaan 500 tidak diganti angka nol. APP_TIMEZONE divalidasi sebelum startup; default Asia/Jakarta. Filter, batas bulan/zona/target, seed idempotent, fail-closed dan kegagalan agregasi termasuk pengujian. Grafik/tren/tindak lanjut tetap tahap M-04.

## Dokumen dan Git

Mulai dari [indeks dokumen](docs/README.md), [PRD](docs/PRD.md), [konteks](docs/PROJECT_CONTEXT.md), [backlog](docs/BACKLOG.md), [catatan pengembangan](docs/DEVELOPMENT_LOG.md), dan [alur Git](docs/GIT_WORKFLOW.md).

- dev: branch kerja pengembangan.
- prod: kandidat rilis yang dipromosikan sesudah validasi; belum berarti operasional/ter-deploy.
- Frontend: https://github.com/alankurniadi12/she-meeting-2-frontend.
- workspace/: salinan launcher opsional untuk layout dua repo, bukan root deployment.

Setiap perubahan wajib menyelaraskan dokumen relevan. Jangan commit .env, kredensial, dependency, data MongoDB, foto lokal, hasil build atau log. Demo tetap dummy; penggunaan data nyata dan hosting perusahaan belum disetujui.
