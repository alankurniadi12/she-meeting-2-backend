# Backlog implementasi dan batas demo

Status: **D0-01 sampai D0-05 selesai serta diuji lokal**. Tambah/detail/koreksi dan progres temuan sudah tersedia; D0-06 sebagian (fondasi audit/versi/retry diuji, tampilan riwayat lengkap belum). Dashboard lengkap M-04 masih sebagian. Target demo pertama pengguna: **9 November 2026**. Waktu pemeliharaan yang tersedia sekitar 1–2 jam waktu luang kerja; tidak ada estimasi pasti seluruh MVP sebelum mulai mengukur pengerjaan.

## D0 — demo alur utama, dikerjakan dahulu

| Urutan | Pekerjaan | Bergantung | Penerimaan |
| --- | --- | --- | --- |
| D0-01 ✅ | Bootstrap Vue/Vite JavaScript + Express dan MongoDB; kunci versi stable | Cek environment lokal | Selesai 9 November: dua lockfile, build, 8 tes, health/readiness dan ping MongoDB lokal berhasil. Detail DEVELOPMENT_LOG. |
| D0-02 ✅ | Seed dummy, akun Camp/Transport/ICT dan admin; sesi login dan akses server | D0-01 | Selesai 9 November: 4 akun dummy, Argon2id, sesi MongoDB, CSRF/Origin, 401 anonim/403 admin bagi divisi, 26 tes lulus dan login browser diuji. |
| D0-03 ✅ | Kerangka merah/biru, sidebar/header/avatar, dashboard pembuka | D0-02 | Selesai 9 November: identitas akun, 4 kartu backend, terbuka/terlambat, indikator bulanan, filter multi-divisi, 18 fixture, 37 tes lulus dan browser desktop/HP diperiksa. |
| D0-04 ✅ | Daftar dan filter multi-divisi dengan hitungan unik | D0-03 | Selesai 9 November: daftar/summary API, filter/pencarian literal, pagination, badge, route Vue Router; 51 tes backend + 2 frontend/build lulus, browser desktop/HP diperiksa. |
| D0-05 ✅ | Tambah/detail/koreksi, progres, status, target kosong, prioritas | D0-04 | Selesai 9 November: create/detail/PATCH/progress API dan UI, aturan status/target/divisi, 62 tes backend + 5 frontend/build lulus, alur browser/HP diuji dan data bertahan refresh. |
| D0-06 (sebagian) | Audit akun divisi dan version conflict | D0-05 | D0-05 sudah menyimpan audit/receipt atomik, CAS versi dan draf konflik dasar. Berikutnya API/tampilan riwayat lengkap, pagination progres/riwayat dan peninjauan konflik yang lebih baik. |
| D0-07 | Verifikasi skenario presentasi dan catat fitur belum selesai | D0-06 | Alur pada PILOT dapat ditunjukkan; tidak mengklaim MVP lengkap |

D0 adalah demo lokal dengan backend nyata dan data dummy. Jika waktu tidak cukup, kecilkan demonstrasi secara terbuka; jangan mengganti login/penyimpanan dengan keberhasilan semu. Demo online tidak harus menjadi syarat demonstrasi lokal kepada leader.

## D1 — melengkapi MVP

| ID | Pekerjaan | FR | Selesai bila |
| --- | --- | --- | --- |
| M-01 (sebagian) | Validasi lengkap, default, filter lanjutan dan badge batas tanggal | 02,04,06 | D0-04: validasi kueri/badge. D0-05: validasi inti create/koreksi/progres dan status diuji; perluasan uji seluruh batas/input/edge case MVP tetap M-01. |
| M-02 | Unggah/lihat foto opsional privat dan kegagalan unggah | 05 | Format/ukuran dibatasi; tanpa sesi ditolak; laporan teks tetap tersedia |
| M-03 (sebagian) | Pembatalan, filter batal, pemulihan admin | 08 | D0-04: filter batal/semua dan hitungan terpisah sudah diuji. Aksi batal/pulihkan beserta alasan/audit belum tersedia. |
| M-04 (sebagian) | Dashboard lengkap dalam batas UI_SPEC | 07 | Kartu/indikator/scope sudah D0-03. Tren 6 bulan, grafik per-divisi dan daftar maksimal 5 tindak lanjut masih rencana. |
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

README root, contoh env, dan script lokal tersedia. M-08 baru sebagian; tes autentikasi/dashboard/seed/daftar/mutasi kritis tersedia. D0-05 selesai, D0-06 sebagian; belum riwayat lengkap, aksi pembatalan, foto/PDF atau seluruh MVP.

Tahap berikutnya: **D0-06**, API/tampilan audit before/after dan progres yang dipaginasi serta peninjauan konflik/draf. Audit/versi/retry tidak ditunda pada write pertama D0-05 agar tidak ada periode write tanpa jejak atau rawan overwrite. Tetap 18 fixture seed plus temuan dummy dari uji manual; akun/sandi tidak berubah. UI admin akun tetap M-06; metadata DEMO_SEED dibedakan dari audit akun.

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
