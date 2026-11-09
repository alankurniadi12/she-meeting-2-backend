# SHE Meeting — Backend

Backend Express.js + JavaScript dan driver MongoDB untuk aplikasi internal SHE Meeting. Folder docs/ merupakan sumber tunggal dokumen bersama frontend/backend.

Status: D0-01 dan D0-02 selesai serta diuji lokal. Login/logout, sesi MongoDB, CSRF/Origin, seed akun/divisi dummy, baca divisi dan baca akun admin tersedia. Dashboard/temuan/audit bisnis, mutasi admin, foto/PDF belum tersedia. Belum deployment.

## Menjalankan mandiri

Gunakan Node kompatibel (diuji 24.10.0; .nvmrc menargetkan LTS 26) dan mongod pada PATH.

```sh
npm ci
```

Terminal pertama:

```sh
npm run db:dev
```

Terminal kedua, buat akun dummy sekali lalu jalankan API:

```sh
npm run seed:demo
npm run dev
```

Seed hanya diizinkan pada MongoDB development loopback. Akun `camp`, `transport`, `ict`, `admin.ict` memakai sandi acak yang tersimpan di `.local/demo-accounts.json` (mode 0600; diabaikan Git). Buka file secara lokal untuk login; jangan kirim ke GitHub. Seed ulang mempertahankan akun/sandi/status/versi yang sudah ada, tanpa membuat temuan. Jika file kredensial hilang, seed ulang tidak mereset sandi akun lama; endpoint reset masih tahap M-06.

API: http://127.0.0.1:4000. Script database memakai loopback port 27027 dan .local/mongodb di repo ini, terpisah dari database default; tanpa autentikasi khusus development dan bukan konfigurasi VPS. Untuk layout workspace induk yang sudah ada, tetap boleh memakai script dari folder induk; pilih salah satu instance port 27027, jangan menjalankan dua bersamaan.

Default tanpa .env sudah tersedia; jika perlu salin .env.example ke .env yang belum ada. Database default she_meeting_dev; test/demo harus memakai prefix sesuai lingkungan. Jangan menyimpan URI berpassword di source/log.

```sh
npm test
# Seluruh tes, setelah MongoDB khusus proyek aktif:
MONGODB_TEST_URI=mongodb://127.0.0.1:27027 npm test
```

Tanpa MONGODB_TEST_URI, 9 tes fondasi/config dijalankan dan suite integrasi dilewati secara eksplisit. Dengan URI test, seluruh 26 tes berjalan pada database unik she_meeting_test_auth_<uuid>, lalu hanya database itu dihapus. DB development tidak dipakai sebagai fallback.

Startup mem-ping MongoDB dan menyiapkan indeks autentikasi sebelum listen. Readiness internal jangan diteruskan reverse proxy internet. API anonim 401; akun divisi ditolak 403 dari /api/v1/admin/*; admin boleh GET /api/v1/admin/accounts (baca saja). Mutasi admin dan temuan belum tersedia. Login/mutasi harus mengirim Origin allowlist; setelah login mutasi juga wajib X-CSRF-Token dari login/me. Sesi beberapa perangkat didukung, logout mencabut sesi saat ini.

Cookie lokal she_session_dev (HttpOnly/SameSite=Lax, absolut 12 jam). Tambahkan COOKIE_SECURE=false hanya untuk lokal HTTP; APP_ENV=demo wajib Secure dan seluruh ALLOWED_ORIGINS HTTPS. Demo memakai __Host-she_session. trust proxy tetap false; konfigurasi proxy, cookie cross-subdomain HTTPS, Vercel/VPS harus diuji saat O-02. Jangan menaruh token atau sandi di localStorage.

## Dokumen dan Git

Mulai dari [indeks dokumen](docs/README.md), [PRD](docs/PRD.md), [konteks](docs/PROJECT_CONTEXT.md), [backlog](docs/BACKLOG.md), [catatan pengembangan](docs/DEVELOPMENT_LOG.md), dan [alur Git](docs/GIT_WORKFLOW.md).

- dev: branch kerja pengembangan.
- prod: kandidat rilis yang dipromosikan sesudah validasi; belum berarti operasional/ter-deploy.
- Frontend: https://github.com/alankurniadi12/she-meeting-2-frontend.
- workspace/: salinan launcher opsional untuk layout dua repo, bukan root deployment.

Setiap perubahan wajib menyelaraskan dokumen relevan. Jangan commit .env, kredensial, dependency, data MongoDB, foto lokal, hasil build atau log. Demo tetap dummy; penggunaan data nyata dan hosting perusahaan belum disetujui.
