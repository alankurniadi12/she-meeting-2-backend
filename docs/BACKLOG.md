# Backlog implementasi dan batas demo

Status: **D0-01 sampai D0-07, M-02 sampai M-06 selesai untuk demo lokal**. Riwayat before/after dan progres dipaginasi; rebase draf konflik diperbaiki dan alur rapat dummy diverifikasi di browser. M-05 PDF hasil filter sudah dapat diunduh. M-01, M-07 dan M-08 masih sebagian; belum ada izin operasional. Target demo pertama pengguna: **9 November 2026**.

## D0 — demo alur utama, dikerjakan dahulu

| Urutan | Pekerjaan | Bergantung | Penerimaan |
| --- | --- | --- | --- |
| D0-01 ✅ | Bootstrap Vue/Vite JavaScript + Express dan MongoDB; kunci versi stable | Cek environment lokal | Selesai 9 November: dua lockfile, build, 8 tes, health/readiness dan ping MongoDB lokal berhasil. Detail DEVELOPMENT_LOG. |
| D0-02 ✅ | Seed dummy, akun Camp/Transport/ICT dan admin; sesi login dan akses server | D0-01 | Selesai 9 November: 4 akun dummy, Argon2id, sesi MongoDB, CSRF/Origin, 401 anonim/403 admin bagi divisi, 26 tes lulus dan login browser diuji. |
| D0-03 ✅ | Kerangka merah/biru, sidebar/header/avatar, dashboard pembuka | D0-02 | Selesai 9 November: identitas akun, 4 kartu backend, terbuka/terlambat, indikator bulanan, filter multi-divisi, 18 fixture, 37 tes lulus dan browser desktop/HP diperiksa. |
| D0-04 ✅ | Daftar dan filter multi-divisi dengan hitungan unik | D0-03 | Selesai 9 November: daftar/summary API, filter/pencarian literal, pagination, badge, route Vue Router; 51 tes backend + 2 frontend/build lulus, browser desktop/HP diperiksa. |
| D0-05 ✅ | Tambah/detail/koreksi, progres, status, target kosong, prioritas | D0-04 | Selesai 9 November: create/detail/PATCH/progress API dan UI, aturan status/target/divisi, 62 tes backend + 5 frontend/build lulus, alur browser/HP diuji dan data bertahan refresh. |
| D0-06 ✅ | Riwayat perubahan akun divisi, paginasi progres dan peninjauan konflik | D0-05 | API/UI riwayat before/after dan progres 10 per halaman; seed lama ditandai; draf dibandingkan dengan versi terbaru dan rebase manual. 63 tes backend dan 6 frontend/build lulus. |
| D0-07 ✅ | Verifikasi skenario presentasi dan catat fitur belum selesai | D0-06 | Browser lokal: login Camp, dashboard, filter Camp+Transport (13 hasil unik saat uji), create dummy, tunda wajib alasan, selesai, riwayat/progres 2 halaman, konflik dua tab dan rebase; API dummy ICT membuktikan edit lintas divisi. Belum uji proyektor/HP fisik atau presentasi leader. |

D0 adalah demo lokal dengan backend nyata dan data dummy. Jika waktu tidak cukup, kecilkan demonstrasi secara terbuka; jangan mengganti login/penyimpanan dengan keberhasilan semu. Demo online tidak harus menjadi syarat demonstrasi lokal kepada leader.

## D1 — melengkapi MVP

| ID | Pekerjaan | FR | Selesai bila |
| --- | --- | --- | --- |
| M-01 (sebagian) | Validasi lengkap, default, filter lanjutan dan badge batas tanggal | 02,04,06 | D0-04: validasi kueri/badge. D0-05: validasi inti create/koreksi/progres dan status diuji; perluasan uji seluruh batas/input/edge case MVP tetap M-01. |
| M-02 ✅ | Unggah/lihat foto opsional privat dan kegagalan unggah | 05 | JPEG/PNG/WebP ≤5 MiB, maksimal 10/temuan; file diolah WebP tanpa metadata di folder privat, baca bersesi, tanpa foto tetap sah. Tes integrasi dan UI lokal. |
| M-03 ✅ | Pembatalan, filter batal, pemulihan admin | 08 | Filter batal/semua dan hitungan terpisah, aksi batal beralasan untuk akun login, pulih beralasan oleh admin, audit before/after, versi/retry dan UI telah diuji lokal. |
| M-04 ✅ | Dashboard lengkap dalam batas UI_SPEC | 07 | Kartu/indikator/scope D0-03 ditambah tren 6 bulan, status per divisi dan maksimal 5 tindak lanjut. Filter multi-divisi dan angka unik diuji di Chrome; 67 tes backend, 7 frontend dan build lulus. |
| M-05 ✅ | PDF pagination/wrapping/filter | 09 | Semua hasil filter termasuk di luar halaman daftar, ringkasan dihitung dari hasil yang sama, teks panjang dibungkus dan halaman bernomor; batas 1.000 eksplisit. Tes integrasi, render visual 3 halaman dan unduh Chrome lokal lulus. |
| M-06 ✅ | UI admin akun/divisi, reset dan revokasi sesi | 01,11 | ADMIN dapat mengelola akun DIVISION dan master divisi aktif/nonaktif; audit, versi dan retry dijaga server. Akun ADMIN lain atau perubahan akun ADMIN bukan cakupan MVP yang disetujui. |
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

README root, contoh env, dan script lokal tersedia. M-08 baru sebagian; tes autentikasi/dashboard/seed/daftar/mutasi/ekspor kritis tersedia. D0-07 selesai sebagai verifikasi teknis demo lokal; seluruh MVP belum.

Tahap berikutnya: pilih pekerjaan D1 yang paling dibutuhkan setelah demo internal; belum ada keputusan leader/pilot. Audit/versi/retry tidak ditunda pada write pertama D0-05 agar tidak ada periode write tanpa jejak atau rawan overwrite. Tetap 18 fixture seed plus temuan dummy dari uji manual; akun/sandi tidak berubah. UI admin akun dan master divisi tersedia pada M-06; metadata DEMO_SEED dibedakan dari audit akun.

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

## 10 November 2026 — M-03 selesai untuk demo lokal

Pembatalan beralasan dan pemulihan beralasan oleh admin tersedia tanpa hapus permanen. Temuan batal read-only, dapat dicari dengan filter Batal, dan tidak masuk hitungan status/dashboard. Audit serta receipt idempoten mengikuti versi temuan. 64 tes backend MongoDB, 7 tes frontend dan build lulus; alur batal/pulih dan audit diperiksa di browser dengan data dummy. Ini implementasi asumsi R-08 untuk prototipe; belum ada keputusan kewenangan perusahaan atau penggunaan operasional.

## 10 November 2026 — M-02 selesai untuk demo lokal

Unggah dan baca foto privat di detail tersedia. Batas 5 MiB sumber/hasil, maksimal 10 foto, validasi decoder dan sesi/CSRF/Origin server; versi, audit dan retry mengikuti fondasi mutasi. File dummy disimpan di `.local/uploads` development. 65 tes backend MongoDB, 7 frontend dan build lulus. Penyimpanan volume persistent, backup/restore, HTTPS dan data nyata belum diuji; jangan anggap siap operasional.

## 10 November 2026 — M-06 master divisi demo lokal

Admin ICT dapat melihat, membuat, mengubah nama, mengaktifkan dan menonaktifkan master divisi di `/admin/divisions`. Kode tetap, nama unik tanpa membedakan huruf besar/kecil, tidak ada hard delete. Nonaktif ditolak selama ada akun DIVISION aktif; riwayat temuan memakai snapshot yang sudah ada. Audit before/after, CAS version, receipt idempoten dan guard kapasitas diterapkan. 67 tes backend MongoDB, 7 tes frontend dan build lulus. Route browser terverifikasi mengarah ke login; setelah seed dummy lokal, login Admin ICT dan GET master divisi menghasilkan 200 dengan tiga divisi. Tampilan setelah login dan mutasi UI belum diuji. Tes mutasi memakai database test terpisah. Akun ADMIN lain dan pengubahan akun ADMIN belum diperlukan untuk demo; bila dibutuhkan kelak, tentukan aturan kewenangannya terlebih dahulu.
