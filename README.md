# SHE Meeting — Backend

Backend Express.js + JavaScript dan driver MongoDB untuk aplikasi internal SHE Meeting. Folder docs/ merupakan sumber tunggal dokumen bersama frontend/backend.

Status: D0-01 sampai D0-07 selesai untuk demo lokal. Login/sesi/CSRF, seed akun/divisi dan 18 temuan dummy, baca akun admin, dashboard ringkas dan daftar/ringkasan temuan tersedia. Tambah/detail/koreksi/progres, audit atomik/versi/retry dan GET riwayat paginasi tersedia. Grafik/tren dashboard, mutasi admin, foto/PDF belum tersedia; pembatalan/pemulihan M-03 tersedia. Belum deployment.

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

Tanpa MONGODB_TEST_URI, 15 tes unit/fondasi/config dijalankan dan empat suite integrasi dilewati secara eksplisit. Dengan URI test, seluruh 64 tes berjalan pada database unik she_meeting_test_auth_<uuid>, she_meeting_test_dashboard_<uuid>, she_meeting_test_findings_<uuid> dan she_meeting_test_write_<uuid>, lalu hanya database tersebut dihapus. DB development tidak dipakai sebagai fallback.

Startup mem-ping MongoDB dan menyiapkan indeks autentikasi/findings sebelum listen. Readiness internal jangan diteruskan reverse proxy internet. API anonim 401; akun divisi ditolak 403 dari /api/v1/admin/*; admin boleh GET /api/v1/admin/accounts (baca saja). Mutasi inti temuan sudah tersedia; mutasi admin dan lampiran belum tersedia; batal/pulihkan tersedia. Login/mutasi harus mengirim Origin allowlist; setelah login mutasi juga wajib X-CSRF-Token dari login/me. Sesi beberapa perangkat didukung, logout mencabut sesi saat ini.

Cookie lokal she_session_dev (HttpOnly/SameSite=Lax, absolut 12 jam). Tambahkan COOKIE_SECURE=false hanya untuk lokal HTTP; APP_ENV=demo wajib Secure dan seluruh ALLOWED_ORIGINS HTTPS. Demo memakai __Host-she_session. trust proxy tetap false; konfigurasi proxy, cookie cross-subdomain HTTPS, Vercel/VPS harus diuji saat O-02. Jangan menaruh token atau sandi di localStorage.

## Dashboard ringkas

GET /api/v1/dashboard memerlukan sesi divisi/admin. Query hanya month=YYYY-MM dan responsibleDivisionIds=<ID dipisah koma, maksimal 50>. Default semua divisi dan bulan kalender APP_TIMEZONE. Snapshot semua tanggal; pilihan bulan hanya memengaruhi dua indikator masuk/selesai. Data batal tidak dihitung, temuan bersama tetap unik. Respons berisi snapshot/period/scope/asOf/today/timeZone/dataMode; kontrak lengkap di docs/API_CONTRACT.md. Endpoint tulis inti tersedia pada D0-05 di bawah; dashboard tetap pembacaan ringkasan.

Dashboard kosong sah mengembalikan nol; galat pembacaan 500 tidak diganti angka nol. APP_TIMEZONE divalidasi sebelum startup; default Asia/Jakarta. Filter, batas bulan/zona/target, seed idempotent, fail-closed dan kegagalan agregasi termasuk pengujian. Grafik/tren/tindak lanjut tetap tahap M-04.

## Daftar rapat D0-04

GET /api/v1/findings dan GET /api/v1/findings/summary memerlukan sesi aktif. Parser bersama menerima pencarian q (literal, case-insensitive, maksimal 100), responsibleDivisionIds (OR maksimal 50), reporterDivisionId, status, priority, from/to (tanggal sah inklusif), dateBasis=reported|completed, cancellation=active|cancelled|all, dan sort=reportedDate:asc|desc atau updatedAt:asc|desc. List menerima page (default 1, maksimum 999999) dan pageSize (default 20, maksimum 100); summary menolak pagination. Input/query di luar allowlist ditolak, bukan operator MongoDB dari klien.

List mengirim data ringkas serta meta.summary dari satu facet MongoDB sebelum pagination. Summary tidak berubah karena pindah halaman; batal dihitung terpisah dari totalValid/status. Proyeksi tidak mengirim audit/progres/foto/rahasia akun. Metadata asOf/today/timeZone menyatakan waktu pemuatan. Badge Baru umur 0–6 hari dan Terlambat dihitung server. Detail/tulis inti ditambahkan pada D0-05; ekspor belum tersedia. Format lengkap serta batas pada docs/API_CONTRACT.md.

## Pencatatan/progres D0-05

POST /findings membuat IN_PROGRESS/version=1. GET /findings/:id membaca detail dan 10 progres terakhir. PATCH /findings/:id hanya koreksi field core; POST /findings/:id/progress menambah catatan/status/prioritas/target. Wajib cookie, Origin dan CSRF; actor/waktu/versi baru server. Target/foto opsional, Tertunda wajib alasan, COMPLETED tanpa foto/approval, koreksi COMPLETED ke aktif wajib alasan. Referensi baru hanya divisi aktif; referensi historis yang tidak berubah boleh tetap nonaktif.

Mutasi membawa mutationId UUID v4 (update juga version). Respons acknowledgement id/reference/version/status/updatedAt, lalu klien GET detail. Retry payload+akun+jenis sama mengembalikan ack lama tanpa duplikasi; penggunaan ulang ID untuk isi berbeda 409. Audit/progres/receipt/versi tersimpan satu write atomik dengan expected version. Konflik 409 + currentVersion, kapasitas histori >8 MiB 409 tanpa menghapus data. createMutationId unik parsial; tidak menerima field actor/audit/receipt dari payload. Rincian batas/allowlist/error di docs/API_CONTRACT.md.

Detail tidak mengirim audit/receipt/hash sandi/storageKey. API/UI riwayat lengkap dan progres paginasi masih D0-06; metadata DEMO_SEED berbeda dari event akun. Tidak ada DELETE/hard delete. Tes mencakup create/retry serentak, koreksi lintas divisi, aturan status, audit before/after/snapshot nama divisi, stale write dan capacity guard.

## Dokumen dan Git

Mulai dari [indeks dokumen](docs/README.md), [PRD](docs/PRD.md), [konteks](docs/PROJECT_CONTEXT.md), [backlog](docs/BACKLOG.md), [catatan pengembangan](docs/DEVELOPMENT_LOG.md), dan [alur Git](docs/GIT_WORKFLOW.md).

- dev: branch kerja pengembangan.
- prod: kandidat rilis yang dipromosikan sesudah validasi; belum berarti operasional/ter-deploy.
- Frontend: https://github.com/alankurniadi12/she-meeting-2-frontend.
- workspace/: salinan launcher opsional untuk layout dua repo, bukan root deployment.

Setiap perubahan wajib menyelaraskan dokumen relevan. Jangan commit .env, kredensial, dependency, data MongoDB, foto lokal, hasil build atau log. Demo tetap dummy; penggunaan data nyata dan hosting perusahaan belum disetujui.

## Riwayat D0-06

GET `/api/v1/findings/:id/progress` dan `/api/v1/findings/:id/history` mengirim 10 terbaru per halaman secara default (`page`, `pageSize` maksimal 50), termasuk temuan batal. Riwayat audit memperlihatkan before/after, akun divisi, waktu, alasan koreksi dan snapshot nama divisi. Event seed lama ditandai sebagai metadata sistem tanpa before/after. Detail tetap memuat hanya 10 progres terbaru; receipt/hash tidak dikirim. Lihat `docs/API_CONTRACT.md`.

D0-07 memverifikasi alur demo dummy; akun ICT mengoreksi temuan Camp lewat API lokal dan audit before/after terbukti. Lihat `docs/PILOT.md`. Tidak ada perubahan API/hosting pada tahap ini.

## Pembatalan M-03

POST `/api/v1/findings/:id/cancel` untuk akun login dan POST `/api/v1/findings/:id/restore` hanya ADMIN. Keduanya perlu `reason`, `version`, `mutationId`, Origin dan CSRF. Detail menampilkan pelaku/alasan batal; riwayat before/after menyimpan alasan aksi. Data batal read-only sampai dipulihkan, namun dapat dibuka lewat filter Batal. Status/progres lama tetap tersimpan. Pengujian lokal M-03: 64 backend MongoDB, 7 frontend dan build lulus; belum deployment.
