# Arsitektur teknis

Pilihan stack dari pengguna; rincian library/deployment berikut adalah rancangan awal yang dapat diubah.

## Implementasi tahap 01 — 9 November 2026

Dua aplikasi mempunyai package.json dan package-lock.json terpisah; root menyediakan script development/build/test tanpa workspace gabungan. Vue 3.5.45, Vite 8.3.6, plugin-vue 6.0.10; Express 5.3.0, driver MongoDB 7.8.0, dotenv 18.0.10, Helmet 8.3.0, CORS 2.8.6 dipilih dari tag stable `latest` registry npm saat bootstrap dan dipin exact. Lockfile menjadi acuan reproduksi; instal ulang memakai npm ci.

Runtime mesin yang tersedia dan diuji: **Node 24.10.0, npm 11.6.0, mongod 8.0.15**. Tidak melakukan upgrade global Node/MongoDB milik pengguna. `.nvmrc` menargetkan Node LTS 26; engines mengizinkan 24.10+ pada major 24 atau major 26. Versi lokal ini bukan klaim runtime terbaru; sebelum hosting pilih patch stable yang didukung/kompatibel dan uji ulang.

MongoDB development dijalankan terpisah pada loopback:27027, data di `.local/mongodb/`, tanpa menyentuh instance default. Ini tanpa autentikasi khusus development, bukan konfigurasi VPS. Backend mem-ping DB sebelum listen dan `/ready` memeriksa ping. `/health` hanya status proses. Namespace data mengembalikan 401 sampai middleware sesi dibuat.

Frontend sementara satu halaman tanpa Vue Router/Pinia karena belum ada halaman bisnis/login. Halaman memeriksa `/health` melalui proxy Vite; status ini tidak mengklaim login/CRUD sudah tersedia. Belum ada session store, CSRF, audit bisnis, PDF, upload, atau deployment. Bagian berikut adalah target implementasi, bukan daftar fitur selesai.

Sumber versi bootstrap: metadata registry resmi [Vue](https://registry.npmjs.org/vue/latest), [Vite](https://registry.npmjs.org/vite/latest), [Express](https://registry.npmjs.org/express/latest), dan [driver MongoDB](https://registry.npmjs.org/mongodb/latest). Nomor yang terkunci dicatat di package.json/lockfile kedua aplikasi, bukan bergantung pada nilai tag mutable sesudah bootstrap.

## Implementasi tahap 02 — D0-02

Bagian ini menggantikan batas autentikasi tahap 01 di atas. Argon2 **0.45.2** dipin dari registry npm resmi; Argon2id memakai 64 MiB, timeCost 3, parallelism 1. API hashing mengikuti [node-argon2 resmi](https://github.com/ranisalt/node-argon2); cookie mengikuti [Express Response API](https://expressjs.com/en/5x/api/#res.cookie). Tidak menambah JWT, Redis, Pinia atau router sebelum diperlukan.

Sesi opaque diimplementasikan dengan driver MongoDB yang sudah ada: cookie acak 256 bit, SHA-256 sebagai ID store, CSRF token 256 bit terikat sesi, expiry 12 jam absolut dan TTL cleanup. Cookie tidak memerlukan secret signing karena token acak hanya diterima jika ada di store; peran/identitas selalu dibaca dari akun aktif, sessionVersion wajib cocok. MongoDB menyimpan counter login per username/IP agar API restart tidak menghapus batas. Rincian batas/format ada di API_CONTRACT.

Startup menyiapkan indeks unik username, satu akun DIVISION aktif/divisi, kode/nama divisi, serta TTL sesi/counter sebelum listen. Seed lokal loopback development saja, non-destruktif, membuat Camp/Transport/ICT/Admin ICT dengan sandi acak ke `.local/demo-accounts.json` (mode 0600, diabaikan Git); tidak mereset sandi akun yang sudah ada. Audit admin masih rencana M-06, seed bukan aktivitas akun perusahaan.

Vue `/` kini menampilkan login atau ringkasan akun/divisi nyata. Fetch memakai credentials, CSRF hanya di memori, timeout 10 detik. Sesi dipulihkan lewat me saat reload/fokus dan dibersihkan saat waktu habis/401; respons tertunda sebelum logout tidak menghidupkan ulang sesi UI. Belum ada dashboard bisnis/route operasional, temuan, foto/PDF atau deployment.

`COOKIE_SECURE=false` hanya lokal development/test HTTP. APP_ENV=demo mewajibkan cookie Secure dan origin HTTPS; contoh env lokal perlu disesuaikan saat hosting. `trust proxy=false` tetap dipertahankan: pembatasan IP di belakang reverse proxy harus dikonfigurasi/diuji pada O-02; jangan mengaktifkan trust proxy generik. Header cookie Secure sudah diuji lokal, bukan bukti browser cross-subdomain HTTPS sudah berhasil.

## Implementasi tahap 03 — dashboard ringkas

GET dashboard dipasang setelah guard sesi; router dashboard juga menolak jika req.auth tidak tersedia agar fail closed jika salah pasang. Service memvalidasi query, lalu satu `$match` + `$group` menghitung kartu, terbuka/terlambat dan indikator bulan, dengan maxTimeMS 5 detik. Array penanggung jawab dicocokkan langsung memakai `$in`, tanpa unwind. Waktu kalender memakai Intl/APP_TIMEZONE yang divalidasi saat startup; bulan completedAt memakai [MongoDB $dateToString dengan timezone](https://www.mongodb.com/docs/manual/reference/operator/aggregation/dateToString/). Tidak ada dependency baru.

Startup menyiapkan indeks read/fixture findings. Seed diperluas menjadi 18 temuan dummy, insert-only melalui seedKey unik; metadata DEMO_SEED dibedakan dari audit bisnis. Tidak ada endpoint tulis temuan pada D0-03.

DashboardView Vue menampilkan kartu status/indikator, filter beberapa divisi dan bulan, refresh manual, state loading/kosong/galat, timestamp dan label demo. Data gagal tidak dirender sebagai nol; respons sebelum component unmount diabaikan. Filter sukses disimpan pada query URL dan dipulihkan setelah refresh. Pilihan bulan hanya untuk indikator periodik; angka status diberi cakupan semua tanggal. Master divisi dibaca dengan activeOnly=false agar riwayat divisi nonaktif dapat difilter.

Masih memakai route `/` untuk login atau dashboard berdasarkan sesi. Router halaman baru ditambahkan ketika daftar/detail diperlukan pada D0-04, bukan route bisnis placeholder sekarang. Grafik tren/per-divisi dan daftar tindak lanjut tetap M-04. Hosting/deep link HTTPS belum diuji.

## Implementasi tahap 04 — daftar rapat dan navigasi

Backend menambah router temuan setelah guard sesi, dengan fail-closed lokal pada router. Parser/filter builder bersama mengontrol pencarian literal, scope OR beberapa divisi, status/prioritas/divisi pelapor, tanggal/basis, pembatalan, pagination dan sort. List menggabungkan rows serta summary seluruh filter dalam satu [$facet MongoDB](https://www.mongodb.com/docs/manual/reference/operator/aggregation/facet/); tidak unwind penanggung jawab, tidak menghitung hanya halaman saat ini. Endpoint summary menggunakan parser/builder yang sama; PDF akan menggunakannya ketika diimplementasikan. Projection explicit membatasi kolom keluar; dua indeks urutan ditambahkan. Tidak mengubah fixture yang sudah ada atau menambah write endpoint.

Frontend memakai Vue Router **4.6.4** exact, stable major 4 yang kompatibel dengan Node 24.10.0 lokal. Percobaan latest major 5 menarik dependency Babel 8 yang mensyaratkan Node >=24.11 (atau 22.18); major 4 dipilih sesuai aturan stable kompatibel tanpa upgrade global. Lockfile akhir tidak memuat dependency percobaan yang dilepas. API navigasi mengikuti [dokumentasi Vue Router](https://router.vuejs.org/guide/essentials/dynamic-matching.html).

Route / mengarah /dashboard dengan query lama, /login untuk login, /dashboard dan /findings memerlukan sesi pada UI. App memulihkan sesi sebelum render halaman privat; 401 kembali login dengan tujuan internal yang diizinkan saja. Tujuan eksternal/malformed/tidak diimplementasikan ditolak ke /dashboard. Guard UI merupakan UX; backend tetap memeriksa akses. Route tak dikenal memberi halaman belum tersedia; detail/CRUD belum dibuka.

Dashboard berpindah dari history.replaceState manual ke query router. Daftar menyimpan filter/page di URL; browser Back/Forward dan refresh memuat ulang data, perubahan filter mengulang page 1, response sebelum unmount/route lama diabaikan. Desktop memakai tabel enam kolom (scroll internal bila ruang sempit), HP kartu dari markup yang sama. Loading/galat menyembunyikan angka lama, empty/page kosong dibedakan. Read-only, tanpa v-html atau aksi sukses semu. Hasil dibatasi 100 baris/halaman, aggregate 5 detik; skala data besar belum diuji.

History mode membutuhkan SPA fallback pada hosting nanti. Deep link lokal Vite sudah diuji, bukan bukti rewrite Vercel/HTTPS O-02 sudah dikonfigurasi. Tidak deployment pada D0-04.

## Implementasi tahap 05 — write inti dan detail

Router temuan menambah POST create, GET detail, PATCH core dan POST progress di belakang sesi/CSRF/Origin yang sudah ada. Validasi JavaScript allowlist tanpa dependency baru; ID/tipe/teks/tanggal/divisi aktif/status dipastikan server. Detail serialisasi explicit, tanpa audit/receipt/secret. Status dan foto mengikuti alur sederhana pengguna.

Write memakai atomisitas satu dokumen MongoDB, filter expected version dan array audit/progres/receipt tertanam, sesuai [panduan atomisitas MongoDB](https://www.mongodb.com/docs/manual/core/write-operations-atomicity/). Fondasi audit/konflik D0-06 didahulukan saat write pertama agar tidak ada periode tanpa integritas. Hasil mutasi adalah acknowledgement immutable, GET detail terpisah untuk data terkini; receipt hash+payload terikat akun/jenis mencegah duplikasi atau penggunaan ulang ID dengan isi berbeda. Guard ukuran BSON kandidat 8 MiB dan unique createMutationId parsial aktif. Tidak menambahkan transaksi multi-collection atau antrean.

Frontend menambah /findings/new, /findings/:id dan /findings/:id/edit, tombol tambah/link detail, informasi pencatat akun vs pelapor, koreksi core dan form progres dengan konfirmasi Selesai untuk seluruh divisi. Draft cache hanya memori tab, keyed akun+resource, tidak localStorage. Draft kosong/tidak diubah mengikuti versi terbaru; draft yang diubah mempertahankan versi awal untuk CAS. Konflik mempertahankan teks/isian, menghentikan save, membuka versi terbaru di tab lain atau membuang draft secara eksplisit setelah peringatan. Peninjauan/merge lebih baik masih D0-06.

Jika response simpan tidak pasti (network/5xx), payload+mutationId disimpan dan field dikunci untuk retry identik; 4xx membolehkan perbaikan isian. Navigasi dicegah saat write berlangsung, peringatan sebelum meninggalkan draft. Setelah acknowledgement, detail dimuat ulang; sukses tidak berasal dari query URL. Draft dihapus setelah sukses/explicit discard, tetapi refresh/menutup tab menghapus cache; browser memberi peringatan, bukan penyimpanan tahan gangguan/offline. Pemulihan sesi/draft penuh lintas refresh tetap M-07, tidak diklaim selesai.

Belum API/UI riwayat penuh, progres paginasi, cancel/restore, foto, PDF atau mutasi admin. Tidak mengubah dependency/runtime/hosting pada tahap ini.

## Komponen

```text
Browser PC/HP
  ├─ HTTPS → frontend Vue/Vite di Vercel (she.<domain-milik-pengguna>)
  └─ HTTPS → reverse proxy VPS (she-api.<domain-milik-pengguna>)
                 └─ Express JavaScript
                      ├─ MongoDB privat, database demo terpisah
                      └─ volume foto privat
ICT → backup database + foto + manifest → salinan di luar VPS
```

Nama host adalah pola contoh, bukan domain yang sudah dimiliki/dikonfigurasi. Backend dan MongoDB berada pada VPS pribadi pengguna untuk demo. Tidak mengubah layanan VPS lain tanpa inventaris terlebih dahulu. Tidak menyiapkan server kantor saat ini.

## Frontend

Vue 3 stable, Vite, Vue Router, JavaScript ES modules; tanpa migrasi TypeScript. CSS biasa dengan variabel desain dan komponen kecil; Pinia hanya untuk sesi/filter yang perlu dibagi, jangan membuat state global untuk seluruh form. Chart.js sebagai kandidat grafik. Gunakan fetch wrapper dengan credentials dan penanganan 401/409/422. Route guard memberi UX; otorisasi tetap server.

Folder rencana: src/pages, components, layouts, router, services, stores, styles. Halaman dashboard, findings list/detail/form, akun/master admin. Tidak perlu SSR untuk aplikasi internal ini.

## Backend

Express stable 5.x, JavaScript ES modules. Router → validasi → service aturan bisnis → repository MongoDB. Gunakan driver resmi MongoDB yang cocok dengan server/Node. Validasi skema (kandidat Zod), password hashing Argon2id, middleware sesi dengan store MongoDB, upload terbatas, HTTP security headers, rate limit login/API. Pilihan library dan versinya dikunci saat bootstrap, bukan mengasumsikan seluruh dependency kompatibel.

Folder rencana: src/config, routes, middleware, validators, services, repositories, lib; tests untuk aturan kritis. Jangan membuat microservices, Redis, antrean, atau container orchestration untuk volume awal.

Audit temuan ditanam pada dokumen temuan, pembaruan kondisional version+audit dalam satu write. Ini menghindari kebutuhan transaksi beberapa collection untuk core MVP. Tidak menjalankan update data lalu insert audit terpisah tanpa jaminan konsistensi. Lihat [model data](DATA_MODEL.md).

## Login dan lintas origin

- Username/sandi akun divisi; admin ICT membuat/reset akun. Tanpa registrasi mandiri dan reset melalui email.
- Sesi server, cookie HttpOnly/Secure/Path=/ dan SameSite=Lax pada API, host-only tanpa Domain. Gunakan awalan __Host- pada HTTPS; lokal memakai nama development.
- Frontend dan API disarankan memakai subdomain dari domain yang sama, sama-sama HTTPS. Walaupun same-site, keduanya cross-origin: fetch credentials=include dan CORS hanya origin frontend eksplisit, bukan wildcard.
- Mutasi memerlukan token CSRF terikat sesi dan pemeriksaan Origin. Login juga memeriksa Origin dan rate limit. Identitas/peran berasal dari sesi, bukan payload.
- Usulan masa sesi: kedaluwarsa absolut 12 jam; beberapa sesi akun divisi diperbolehkan. Logout mencabut sesi saat ini; reset/nonaktif/ubah peran menaikkan sessionVersion untuk mencabut semua sesi. Periksa active+sessionVersion tiap permintaan.
- Jangan menyimpan sandi/token sesi dalam localStorage atau mengekspos URI MongoDB di frontend.
- Alamat vercel.app dengan API domain berbeda dapat terkena pembatasan cookie pihak ketiga. Jangan mengatasinya dengan menonaktifkan keamanan; gunakan custom subdomain atau siapkan proxy same-origin yang diuji. Preview tidak otomatis diberi akses backend operasional.

## PDF dan foto

PDF dibuat server menggunakan library PDF (kandidat PDFKit), tanpa Chromium/headless browser agar beban VPS ringan. Teks panjang dibungkus, tabel dipaginasi, header diulang, metadata/filter/jumlah/baris jelas. Foto tidak harus tertanam pada PDF MVP. Semua filter dan hitungan menggunakan query builder yang sama.

Foto disimpan di persistent volume privat, dilayani API setelah login. Kegagalan foto tidak menggagalkan laporan teks yang sudah tersimpan; UI memberi opsi unggah ulang. Foto tidak disimpan ke Vercel filesystem.

## Versi stable dan sumber resmi

Pemeriksaan referensi 9 November 2026:

| Komponen | Arah versi | Referensi |
| --- | --- | --- |
| Vue | Major stable 3, pilih patch stable terbaru saat bootstrap; bukan RC | [Vue FAQ](https://vuejs.org/about/faq), [kebijakan rilis](https://vuejs.org/about/releases) |
| Express | Stable 5.x; verifikasi patch saat bootstrap | [Express API](https://expressjs.com/en/api/) |
| Node | LTS 26.x, patch terbaru yang kompatibel; Vercel mendukung 26.x | [Node releases](https://nodejs.org/en/about/previous-releases), [Vercel Node](https://vercel.com/docs/functions/runtimes/node-js/node-js-versions) |
| MongoDB | Dokumentasi menyebut 9.0 current stable; pilih patch self-managed yang cocok OS/driver saat bootstrap | [MongoDB releases](https://www.mongodb.com/docs/manual/release-notes/), [driver compatibility](https://www.mongodb.com/docs/drivers/compatibility/?driver-language=javascript&javascript-driver-framework=nodejs) |
| Vite | Stable terbaru yang cocok dengan Node dan plugin Vue | [Vite guide](https://vite.dev/guide/) |

Tabel di atas merupakan arah versi pada perencanaan; hasil bootstrap aktual ada di bagian Implementasi tahap 01 dan lockfile. Package.json/lockfile sekarang tersedia untuk kedua aplikasi. Simpan hasil pengecekan versi, package-lock.json, versi Node, dan tag/digest image saat bootstrap. Update versi diuji dahulu; deployment memakai npm ci dan image terkunci, tidak menarik tag latest secara diam-diam. Bila kompatibilitas gagal, dokumentasikan pilihan supported stable alternatif dan alasannya.

## Keterbatasan

RAM 4 GB dan 2 vCPU dapat menjadi titik awal demo ringan, tetapi layanan yang sudah berjalan, kapasitas kosong, OS, dan performa belum diperiksa. MongoDB satu instance tidak menyediakan failover. PDF serial terbatas dan batas foto perlu diuji. Tidak mengklaim siap produksi.

## M-02 — penyimpanan foto lokal privat

Busboy membatasi satu file dan tiga field multipart; Sharp memverifikasi serta mengolah gambar menjadi WebP tanpa metadata sumber. Backend menyimpan file di UPLOAD_DIR absolut atau `.local/uploads` development dengan mode privat, tidak di bawah public/static. GET file memeriksa sesi dan referensi metadata MongoDB. Write foto memakai guard versi, receipt idempoten dan audit atomik, dengan pembersihan file pada kegagalan write. Filesystem dan MongoDB tidak transaksional bersama; backup/restore keduanya dan pemeriksaan orphan tetap pekerjaan operasi sebelum pilot. Deployment belum dilakukan.
