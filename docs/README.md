# Persiapan MVP SHE Meeting

Status 9 November 2026: paket kebutuhan dari tiga putaran wawancara tersedia dan **fondasi D0-01 dan autentikasi D0-02 sudah berjalan serta diuji lokal**. Dashboard dan fitur bisnis temuan belum dibuat; belum deployment atau persetujuan operasional.

## Mulai membaca

1. [PRD](PRD.md) — tujuan, cakupan MVP, kebutuhan, dan kriteria penerimaan.
2. [UI dan dashboard](UI_SPEC.md) — susunan halaman, perilaku daftar rapat, dan rumus statistik.
3. [Backlog implementasi](BACKLOG.md) — urutan demo pertama sampai MVP lengkap.
4. [Keputusan](DECISIONS.md) dan [wawancara](REQUIREMENTS_INTERVIEW.md) — sumber keputusan dan pertanyaan yang sudah terjawab.

## Paket dokumen

| Dokumen | Kegunaan |
| --- | --- |
| [PRD](PRD.md) | Acuan kebutuhan produk |
| [Alur pengguna](USER_FLOWS.md) | Pelaporan, progres, penundaan, selesai, koreksi, pembatalan |
| [Matriks akses](ACCESS_CONTROL.md) | Akun divisi bersama, admin ICT, pemeriksaan akses server |
| [Model data](DATA_MODEL.md) | Entitas, validasi, audit, tanggal, indeks |
| [Kontrak API](API_CONTRACT.md) | Endpoint, payload, filter, galat, konflik pembaruan |
| [Arsitektur](ARCHITECTURE.md) | Vue JavaScript, Express, MongoDB, autentikasi, pilihan versi |
| [UI](UI_SPEC.md) | Sidebar, header, dashboard, daftar rapat, detail/form |
| [Backlog](BACKLOG.md) | Prioritas, dependensi, batas demo dan MVP |
| [Pengujian](TEST_PLAN.md) | Skenario dan kriteria lulus |
| [Deployment dan operasi](DEPLOYMENT.md) | Vercel, VPS, domain, lingkungan, backup dan pemulihan |
| [Demo dan pilot](PILOT.md) | Skenario presentasi, risiko, persetujuan data nyata |
| [Catatan keputusan](DECISIONS.md) | Keputusan pengguna dan asumsi yang bisa diubah |
| [Wawancara](REQUIREMENTS_INTERVIEW.md) | Jejak tiga putaran pembahasan |
| [Catatan pengembangan](DEVELOPMENT_LOG.md) | Tahap yang selesai, hasil uji nyata, dan batasnya |
| [Git dua repo](GIT_WORKFLOW.md) | Origin, dev/prod, dokumen kanonis, staging dan promosi |
| [Konteks proyek](PROJECT_CONTEXT.md) | Keputusan percakapan terbaru dan arsip awal |

## Arti status keputusan

- **Keputusan pengguna:** berlaku sebagai kebutuhan produk, bukan klaim SOP/perizinan perusahaan.
- **Rancangan teknis/usulan:** pilihan awal untuk implementasi; boleh diubah dengan alasan dan memperbarui dokumen terkait.
- **Belum diketahui:** tidak ditebak; lihat daftar pada [catatan keputusan](DECISIONS.md).

Aturan teknis bernomor R-01 dan seterusnya di catatan keputusan adalah asumsi prototipe. Dokumen lain menggunakan aturan itu secara konsisten tanpa menganggapnya telah disahkan pengguna.

## Kondisi workspace dan langkah berikutnya

Kedua folder aplikasi berisi kode dan lockfile terpisah. Fondasi meliputi Vue/Vite JavaScript, Express, MongoDB, health/readiness, konfigurasi lokal; D0-02 menambah seed akun/divisi dummy, login/logout, sesi, CSRF/Origin, baca divisi/akun admin, dan 26 tes yang dijalankan dengan MongoDB test nyata. [README utama](../README.md) menjelaskan cara menjalankan.

**Selanjutnya D0-03:** dashboard pembuka dan navigasi setelah login, dengan statistik backend. Halaman akun belum menjadi dashboard bisnis; spesifikasi dashboard/list dan kontrak endpoint bisnis tetap rencana. Tidak mengklaim seluruh D0 atau MVP selesai.

Perubahan kode wajib memperbarui dokumentasi yang relevan, termasuk backlog dan catatan pengembangan, sesuai instruksi pengguna saat memulai coding.

## Lokasi Git dokumen

Folder ini berada di repo backend. Pada workspace gabungan, docs dan PROJECT_CONTEXT.md di folder induk merupakan symlink agar jalur lama tetap berlaku. Setiap perubahan spesifikasi frontend/backend dicatat di sumber ini; lihat GIT_WORKFLOW.
