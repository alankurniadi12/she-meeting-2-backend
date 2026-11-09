# Arsitektur teknis

Pilihan stack dari pengguna; rincian library/deployment berikut adalah rancangan awal yang dapat diubah.

## Implementasi tahap 01 — 9 November 2026

Dua aplikasi mempunyai package.json dan package-lock.json terpisah; root menyediakan script development/build/test tanpa workspace gabungan. Vue 3.5.45, Vite 8.3.6, plugin-vue 6.0.10; Express 5.3.0, driver MongoDB 7.8.0, dotenv 18.0.10, Helmet 8.3.0, CORS 2.8.6 dipilih dari tag stable `latest` registry npm saat bootstrap dan dipin exact. Lockfile menjadi acuan reproduksi; instal ulang memakai npm ci.

Runtime mesin yang tersedia dan diuji: **Node 24.10.0, npm 11.6.0, mongod 8.0.15**. Tidak melakukan upgrade global Node/MongoDB milik pengguna. `.nvmrc` menargetkan Node LTS 26; engines mengizinkan 24.10+ pada major 24 atau major 26. Versi lokal ini bukan klaim runtime terbaru; sebelum hosting pilih patch stable yang didukung/kompatibel dan uji ulang.

MongoDB development dijalankan terpisah pada loopback:27027, data di `.local/mongodb/`, tanpa menyentuh instance default. Ini tanpa autentikasi khusus development, bukan konfigurasi VPS. Backend mem-ping DB sebelum listen dan `/ready` memeriksa ping. `/health` hanya status proses. Namespace data mengembalikan 401 sampai middleware sesi dibuat.

Frontend sementara satu halaman tanpa Vue Router/Pinia karena belum ada halaman bisnis/login. Halaman memeriksa `/health` melalui proxy Vite; status ini tidak mengklaim login/CRUD sudah tersedia. Belum ada session store, CSRF, audit bisnis, PDF, upload, atau deployment. Bagian berikut adalah target implementasi, bukan daftar fitur selesai.

Sumber versi bootstrap: metadata registry resmi [Vue](https://registry.npmjs.org/vue/latest), [Vite](https://registry.npmjs.org/vite/latest), [Express](https://registry.npmjs.org/express/latest), dan [driver MongoDB](https://registry.npmjs.org/mongodb/latest). Nomor yang terkunci dicatat di package.json/lockfile kedua aplikasi, bukan bergantung pada nilai tag mutable sesudah bootstrap.

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
