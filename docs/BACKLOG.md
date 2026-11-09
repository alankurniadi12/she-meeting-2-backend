# Backlog implementasi dan batas demo

Status: **D0-01 dan D0-02 selesai serta diuji lokal**. D0-03 dan seterusnya belum selesai. Halaman akses akun sementara belum menjadi dashboard data bisnis. Target demo pertama pengguna: **9 November 2026**. Waktu pemeliharaan yang tersedia sekitar 1–2 jam waktu luang kerja; tidak ada estimasi pasti seluruh MVP sebelum mulai mengukur pengerjaan.

## D0 — demo alur utama, dikerjakan dahulu

| Urutan | Pekerjaan | Bergantung | Penerimaan |
| --- | --- | --- | --- |
| D0-01 ✅ | Bootstrap Vue/Vite JavaScript + Express dan MongoDB; kunci versi stable | Cek environment lokal | Selesai 9 November: dua lockfile, build, 8 tes, health/readiness dan ping MongoDB lokal berhasil. Detail DEVELOPMENT_LOG. |
| D0-02 ✅ | Seed dummy, akun Camp/Transport/ICT dan admin; sesi login dan akses server | D0-01 | Selesai 9 November: 4 akun dummy, Argon2id, sesi MongoDB, CSRF/Origin, 401 anonim/403 admin bagi divisi, 26 tes lulus dan login browser diuji. |
| D0-03 | Kerangka merah/biru, sidebar/header/avatar, dashboard pembuka | D0-02 | Identitas akun benar; kartu status bersumber data backend, label demo terlihat |
| D0-04 | Daftar dan filter multi-divisi dengan hitungan unik | D0-03 | Temuan bersama muncul sekali; angka mengikuti filter; pencarian dasar berfungsi |
| D0-05 | Tambah/detail/koreksi, progres, status, target kosong, prioritas | D0-04 | Awal Diproses, Tertunda wajib alasan, Selesai tanpa foto, data bertahan setelah refresh |
| D0-06 | Audit akun divisi dan version conflict | D0-05 | Siapa berupa akun divisi, before/after tersimpan, stale edit ditolak tanpa hilang draf |
| D0-07 | Verifikasi skenario presentasi dan catat fitur belum selesai | D0-06 | Alur pada PILOT dapat ditunjukkan; tidak mengklaim MVP lengkap |

D0 adalah demo lokal dengan backend nyata dan data dummy. Jika waktu tidak cukup, kecilkan demonstrasi secara terbuka; jangan mengganti login/penyimpanan dengan keberhasilan semu. Demo online tidak harus menjadi syarat demonstrasi lokal kepada leader.

## D1 — melengkapi MVP

| ID | Pekerjaan | FR | Selesai bila |
| --- | --- | --- | --- |
| M-01 | Validasi lengkap, default, filter lanjutan dan badge batas tanggal | 02,04,06 | Validasi client/server konsisten; uji hari 0/6/7 lulus |
| M-02 | Unggah/lihat foto opsional privat dan kegagalan unggah | 05 | Format/ukuran dibatasi; tanpa sesi ditolak; laporan teks tetap tersedia |
| M-03 | Pembatalan, filter batal, pemulihan admin | 08 | Alasan wajib, data/audit tidak hilang, angka default mengecualikan batal |
| M-04 | Dashboard lengkap dalam batas UI_SPEC | 07 | Tren, per-divisi, tindak lanjut sesuai definisi dan scope |
| M-05 | PDF pagination/wrapping/filter | 09 | Semua hasil filter, ringkasan cocok, teks panjang terbaca, batas jelas |
| M-06 | UI admin akun/divisi, reset dan revokasi sesi | 01,11 | Divisi tidak bisa akses admin; reset memutus semua sesi akun |
| M-07 | Responsif, keyboard, state kosong/galat/sesi berakhir | 10 | Rapat desktop dan alur HP dapat dicoba tanpa kehilangan data |
| M-08 | Konfigurasi lokal dan contoh env; smoke/integrasi kritis | 01–12 | Pengembang dapat menjalankan dari README tanpa secret di git |

## D2 — demo online dan kesiapan pilot

| ID | Pekerjaan | Bergantung | Penerimaan |
| --- | --- | --- | --- |
| O-01 | Inventaris VPS, pilih OS/image kompatibel, cek layanan/kapasitas | Akses/konfigurasi tersedia | Tidak mengganggu layanan yang ada; kebutuhan resources tercatat |
| O-02 | Vercel + API VPS + DNS/TLS/subdomain | O-01 dan build stabil | Login lintas origin, deep link, CSRF, upload/PDF berhasil melalui HTTPS |
| O-03 | Backup DB+foto+manifest dan uji restore terisolasi | O-02 | Data, foto dan audit pulih; hasil/durasi dicatat |
| O-04 | UAT dummy dan presentasi leader | D1 yang dibutuhkan demo | Daftar masalah/prioritas, keputusan persetujuan dicatat manual di dokumen |
| O-05 | Evaluasi hosting/data nyata dan rencana pilot | Persetujuan leader | Izin, pemilik operasi, jadwal, data dan backup disepakati sebelum operasional |

## Status dokumentasi dan cakupan saat ini

README root, contoh env, dan script lokal tersedia. M-08 baru sebagian; tes autentikasi tersedia, tes aturan bisnis temuan menyusul. D0-03 belum selesai: identitas login sudah nyata, tetapi statistik temuan backend belum ada.

Tahap berikutnya: **D0-03**, dashboard pembuka dan kerangka navigasi setelah login, dengan ringkasan yang bersumber backend. Seed D0-02 hanya akun/divisi; seed temuan diperlukan pada tahap data berikutnya. UI membuat/reset/nonaktifkan akun tetap M-06; tes revokasi D0-02 mengubah status/sessionVersion langsung di database test, bukan klaim endpoint reset sudah tersedia.

## Definition of Done

- Perilaku sesuai PRD dan detail aturan yang dirujuk; asumsi yang diubah memperbarui dokumen.
- Akses/validasi server dan state UI galat diuji untuk fitur terkait.
- Mutasi menyimpan audit akun divisi dan melindungi konflik.
- Data dummy, tanpa identitas perusahaan fiktif atau secret di repositori.
- Tidak ada regresi pada jalur rapat yang sudah berjalan.
- Klaim demo/MVP/operasional dibedakan. Deployment bukan bukti persetujuan perusahaan.

## Ditunda

Form publik, login pribadi, approval/verifikasi, status per divisi, import Word, Excel, email/WA, AI, jadwal/absensi rapat, persentase progres, realtime/websocket, offline, upload avatar khusus, SaaS/billing. Tidak menambahkannya hanya karena library tersedia.

## Penyiapan Git sebelum D0-02

Sesuai permintaan pengguna, repo frontend/backend disiapkan terpisah pada URL yang diberikan, dengan dev/prod dan dokumen bersama di backend/docs. Ini pekerjaan sinkronisasi fondasi, tidak mengubah status fitur D0-02 dan tidak menjalankan deployment. Prosedur serta pemeriksaan di GIT_WORKFLOW.md.
