# Pengujian, UAT, dan bukti penerimaan

Rencana penerimaan seluruh MVP. **Hasil sampai D0-05: 62 tes backend dengan MongoDB nyata + 5 tes frontend/build lulus; alur tambah/detail/koreksi/progres dan konflik dua tab diperiksa di browser.** T-01–T-04 akses/sesi dicakup dengan batas reset/nonaktif melalui DB test, cookie HTTPS hanya header. D0-04 mencakup filter/daftar/unik/pagination/tanggal/badge; D0-05 menambah bagian T-05–T-08, T-14/T-15 dan guard kapasitas T-23 (tanpa API/UI audit lengkap atau pembatalan/foto).

Belum seluruh T-01–T-24 selesai. Foto/PDF, backup/restore, hosting cross-subdomain/deep link Vercel, admin mutasi, proyektor kantor, pagination audit/progres dan peninjauan konflik lengkap tetap belum diuji. Jangan menyamakan lulus tes lokal dengan persetujuan perusahaan. Bukti rinci di [DEVELOPMENT_LOG](DEVELOPMENT_LOG.md).

## Menjalankan tes saat ini

Dari repo backend, `npm test` menjalankan tes fondasi/config; suite integrasi dilewati secara eksplisit bila MONGODB_TEST_URI tidak ada. Jalankan MongoDB khusus proyek lalu `MONGODB_TEST_URI=mongodb://127.0.0.1:27027 npm test` untuk seluruh 62 tes. Suite membuat database unik `she_meeting_test_auth_<uuid>`, `she_meeting_test_dashboard_<uuid>`, `she_meeting_test_findings_<uuid>` dan `she_meeting_test_write_<uuid>` lalu menghapus hanya database tersebut; tidak memakai DB development sebagai fallback. Frontend: `npm test` (5 tes URL/tujuan login, draf/retry dan notice sukses), `npm run build`, serta pemeriksaan browser manual. Tanpa URI test backend, 15 tes unit/fondasi/config berjalan dan 4 suite integrasi dilewati.

Seed ulang diperiksa identik (4 akun/3 divisi; sandi, status, versi dan timestamp tidak berubah), file kredensial mode 0600. D0-03 menambah 18 fixture temuan (2 batal) insert-only. Rerun dengan clock lebih maju dan setelah fixture disunting diuji tidak menimpa data/versi/audit. Foto/fixture unggahan di bagian berikut masih target tahap foto.

## Fixture dummy

Seed minimal 18 temuan sintetik: masing-masing status, satu dan beberapa penanggung jawab, target kosong/hari ini/lewat, prioritas kosong/LOW/MEDIUM/HIGH, usia 0/6/7 hari, tanggal bulan sebelumnya, tanpa foto/dengan foto, batal, serta uraian panjang. Divisi demo Camp/Transport/ICT dan master lain bernama jelas Demo bila dibutuhkan. Pelapor Contoh 01 dst, lokasi Area Demo A dst; tidak memakai data operasional. Tanggal fixture relatif ke clock tes; jangan menggantungkan tes pada 9 November selamanya.

## Matriks penerimaan

| ID | FR | Skenario | Harapan |
| --- | --- | --- | --- |
| T-01 | 01 | Akses list/detail/dashboard/foto/PDF tanpa sesi | Semua ditolak server; health tidak membocorkan konfigurasi |
| T-02 | 01,11 | Akun divisi memanggil endpoint admin langsung | 403 walaupun request dibentuk manual |
| T-03 | 01 | Dua perangkat login memakai akun divisi | Keduanya bisa; logout satu tidak mengeluarkan yang lain; audit tetap akun divisi |
| T-04 | 01,11 | Reset sandi/nonaktif akun | Semua sesi lama gagal pada permintaan selanjutnya |
| T-05 | 02 | Akun Camp mencatat atas nama pelapor divisi lain dan mengedit temuan ICT | Berhasil; identitas pelapor dan akun pembuat berbeda |
| T-06 | 02,03 | Buat tanpa target/foto, dengan dua penanggung jawab | Status Diproses; Belum ditentukan; satu record, audit create |
| T-07 | 03 | Tertunda tanpa/dengan alasan, lanjutkan dan Selesai | Tanpa alasan 422; alasan sah tersimpan; selesai tanpa foto/approval |
| T-08 | 03,08 | Koreksi salah pilih Selesai lalu buat temuan baru untuk kejadian berulang | Koreksi butuh alasan dan audit; kejadian baru punya ID baru |
| T-09 | 04,06 | Usia hari 0/6/7, tengah malam zona aplikasi, tanggal masa depan | Baru hanya 0–6; future ditolak; tanggal input lama tidak menjadi Baru karena baru diketik |
| T-10 | 04,07 | Target kosong/hari ini/kemarin dan temuan selesai | Kosong/hari ini tidak terlambat; kemarin aktif terlambat; selesai tidak |
| T-11 | 06,07 | Pilih dua divisi, temuan punya keduanya | List/total satu; grafik kontribusi per divisi boleh dua dengan keterangan |
| T-12 | 06,09 | Pencarian, filter tanggal/basis, status, batal dan pagination | Summary seluruh hasil; PDF seluruh hasil filter; tidak hanya page saat ini |
| T-13 | 07 | Masuk bulan lalu selesai bulan ini; batal; target kosong | Masuk dan selesai pada bulan masing-masing; batal keluar dari snapshot; tanpa verifiedAt |
| T-14 | 08,12 | Dua akun simpan dari version sama | Satu berhasil, satu 409; draf kedua tetap; satu audit per operasi |
| T-15 | 08,12 | Ulangi mutationId setelah timeout | Tidak membuat temuan/progres/audit ganda |
| T-16 | 08 | Batal tanpa/dengan alasan, filter batal, pulihkan | Alasan wajib; data/audit tidak hilang; restore admin saja |
| T-17 | 05 | JPEG valid, file HTML/SVG disamarkan, oversize, filename path traversal | Hanya file valid diterima; tidak keluar storage privat; tidak dapat dibuka publik |
| T-18 | 05,12 | Konflik versi/DB gagal ketika unggah | Metadata/audit tidak parsial; file baru orphan dibersihkan; teks tersimpan tidak hilang |
| T-19 | 09 | PDF nol hasil, dua halaman, teks panjang, >1.000 hasil | PDF terbaca/filter jelas; header/nomor halaman; batas eksplisit tanpa truncation |
| T-20 | 01–12 | XSS teks, payload operator Mongo, Origin/CSRF salah | Teks aman dirender, payload ditolak, mutasi lintas situs ditolak server |
| T-21 | 10 | Desktop/proyektor dan viewport HP; keyboard | Filter terbaca, form/aksi tidak terpotong, status punya teks |
| T-22 | 11 | Backup DB+foto, restore ke lingkungan terisolasi | Jumlah, status, audit, akun, file cocok; sesi lama tidak ikut berlaku |
| T-23 | 08,12 | Batas histori simulasi dan galat write | Penolakan terkontrol, tidak membuang audit; tidak menampilkan sukses palsu |
| T-24 | 01,10 | Refresh deep link Vercel, cookie pada subdomain HTTPS, sesi habis | Deep link bekerja; login tetap sah; sesi habis memberi login ulang tanpa mutasi palsu |

## Urutan eksekusi

- Unit: rumus tanggal, validator, filter/query builder, transisi, perhitungan unik, diff audit.
- Integrasi dengan database uji terpisah: autentikasi/role, mutasi+audit/version, retry, pembatalan, unggah dan ekspor.
- Smoke UI alur demo: login → dashboard → filter dua divisi → catat → tunda → selesai → riwayat; lanjut PDF/foto saat fiturnya selesai.
- Visual manual PDF dan layar: jangan menyatakan PDF rapi hanya dari respons HTTP 200; buka/render PDF fixture panjang dan beberapa halaman.
- Operasi: uji pemulihan, restart proses, persistensi foto/database, dan deep link/cookie sesudah deployment dummy.

## UAT dan kriteria pilot

ICT menyiapkan data; calon perwakilan Camp/Transport/ICT bila bersedia mencoba tugas nyata dengan data dummy. Catat waktu pencatatan/pencarian, kebutuhan bantuan, galat, dan informasi yang membingungkan. Target numerik dan durasi pilot belum disepakati. Tidak ada kelulusan jika hak akses gagal, data hilang, angka salah, atau perubahan menimpa diam-diam.

Template bukti: tanggal/lingkungan/commit, skenario, hasil aktual, lulus/gagal, lampiran, pelaksana (divisi cukup), tindak lanjut. Persetujuan operasional tetap terpisah dari lulus tes teknis.

## Validasi D0-06

Integrasi test_write memeriksa halaman progres lebih dari 10, audit CREATED dan event catatan, ObjectId before/after, actor tanpa metadata receipt, parameter salah/berulang, akses anonim, ID hilang, dan fixture DEMO_SEED lama. Tes frontend memeriksa rebase field yang diedit dan field terbaru tanpa memutasi draf sumber. Build frontend juga dijalankan. Pemeriksaan browser manual D0-06 belum dilakukan; uji proyektor/HP pada alur baru tetap dibutuhkan D0-07.

## Validasi D0-07

Uji browser lokal menjalankan alur pada PILOT: dashboard 17 valid sebelum uji, filter Camp+Transport 13 unik, create dummy 2 divisi tanpa target/foto, validasi alasan Tertunda, Selesai, 11 progres dan 12 audit yang dipaginasi, konflik progres/koreksi dua tab serta rebase. Bug `structuredClone` terhadap proxy Vue ditemukan, diperbaiki, dan diulang hingga save berhasil. API lokal dengan akun dummy ICT menguji koreksi lintas divisi dan actor/before/after audit. Tes frontend menambah regresi proxy reaktif. Batas: viewport browser uji tetap 841 px saat override 390/1440, sehingga uji responsif D0-07 tidak diklaim lulus; tidak ada uji fisik proyektor/HP, HTTPS, atau UAT perusahaan.

## Validasi M-03 — 10 November 2026

64 tes backend MongoDB lulus: validasi alasan/field, anonim/CSRF, role admin, transisi aktif-batal-pulih, replay idempoten, penolakan write saat batal, filter dan ringkasan, serta audit before/after/reason/actor. 7 tes frontend dan build lulus. Browser lokal menguji satu temuan dummy dibatalkan dan dipulihkan oleh akun admin; tampilan detail dan dua event audit diverifikasi. Role divisi untuk restore diuji lewat integrasi server. Belum uji layar fisik, hosting HTTPS atau data operasional.

## Validasi M-02 — 10 November 2026

65 tes backend MongoDB lulus. Tes baru memakai PNG dummy: tanpa sesi 401, tanpa CSRF 403, isi palsu 422, berkas terlalu besar 413, unggah 201, retry 200 tanpa file kedua, versi stale 409 dan batas 10 foto 409, GET privat WebP 200, audit ATTACHMENT_ADDED, baca setelah batal 200 dan unggah saat batal 409. 7 tes frontend dan build lulus. Browser lokal menampilkan foto dummy yang berhasil dimuat serta event auditnya. Uji volume persistent/backup/restore dan HTTPS belum dilakukan; M-02 hanya dinyatakan selesai untuk demo lokal.

## Validasi M-06 sebagian — 10 November 2026

66 tes backend MongoDB dan 7 tes frontend/build lulus. Tes integrasi auth memakai DB test terpisah: divisi POST admin 403, pembuatan admin tambahan 403, create akun divisi 201 dan retry 200 tanpa duplikasi, login akun baru, reset sandi mencabut sesi dan sandi lama, nonaktif mencabut sesi, retry tanpa audit ganda, audit tidak memuat sandi/hash. Browser lokal Admin ICT menampilkan menu Kelola akun dan empat akun dummy. Uji mutasi browser terhadap akun development tidak dilakukan agar kredensial demo yang sudah dipakai pengguna tetap utuh. Master divisi, perubahan admin, dan perangkat kantor masih terbuka.

## Validasi M-06 master divisi — 10 November 2026

67 tes backend MongoDB dan 7 tes frontend/build lulus. Tes integrasi menolak akun divisi pada endpoint admin, memeriksa create/retry/duplikat nama case-insensitive, rename dengan CAS version, audit before/after, larangan nonaktif saat akun DIVISION aktif, lalu nonaktif setelah akun dimatikan. Aktivasi ulang akun saat master nonaktif juga ditolak. Halaman frontend dibangun dan rute login internal diuji; setelah seed dummy lokal login Admin ICT dan GET master divisi berhasil 200; tampilan setelah login dan mutasi UI belum diuji. Perangkat kantor dan kewenangan akun ADMIN lain belum diuji.
