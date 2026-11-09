# SHE Meeting — Backend

Backend Express.js + JavaScript dan driver MongoDB untuk aplikasi internal SHE Meeting. Folder docs/ merupakan sumber tunggal dokumen bersama frontend/backend.

Status: fondasi D0-01 selesai dan diuji lokal. GET /health dan GET /ready internal tersedia; namespace /api/v1/* masih 401. Login/peran, seed, temuan, audit bisnis, foto dan PDF belum diimplementasikan. Belum deployment.

## Menjalankan mandiri

Gunakan Node kompatibel (diuji 24.10.0; .nvmrc menargetkan LTS 26) dan mongod pada PATH.

```sh
npm ci
```

Terminal pertama:

```sh
npm run db:dev
```

Terminal kedua:

```sh
npm run dev
```

API: http://127.0.0.1:4000. Script database memakai loopback port 27027 dan .local/mongodb di repo ini, terpisah dari database default; tanpa autentikasi khusus development dan bukan konfigurasi VPS. Untuk layout workspace induk yang sudah ada, tetap boleh memakai script dari folder induk; pilih salah satu instance port 27027, jangan menjalankan dua bersamaan.

Default tanpa .env sudah tersedia; jika perlu salin .env.example ke .env yang belum ada. Database default she_meeting_dev; test/demo harus memakai prefix sesuai lingkungan. Jangan menyimpan URI berpassword di source/log.

```sh
npm test
```

Delapan tes fondasi tersedia. Startup mem-ping MongoDB sebelum listen. Readiness internal jangan diteruskan oleh reverse proxy internet. Hak akses bisnis dan sesi belum dibuat; respons 401 saat ini hanya penutup namespace.

## Dokumen dan Git

Mulai dari [indeks dokumen](docs/README.md), [PRD](docs/PRD.md), [konteks](docs/PROJECT_CONTEXT.md), [backlog](docs/BACKLOG.md), [catatan pengembangan](docs/DEVELOPMENT_LOG.md), dan [alur Git](docs/GIT_WORKFLOW.md).

- dev: branch kerja pengembangan.
- prod: kandidat rilis yang dipromosikan sesudah validasi; belum berarti operasional/ter-deploy.
- Frontend: https://github.com/alankurniadi12/she-meeting-2-frontend.
- workspace/: salinan launcher opsional untuk layout dua repo, bukan root deployment.

Setiap perubahan wajib menyelaraskan dokumen relevan. Jangan commit .env, kredensial, dependency, data MongoDB, foto lokal, hasil build atau log. Demo tetap dummy; penggunaan data nyata dan hosting perusahaan belum disetujui.
