# Catatan pengembangan

Setiap tahap mencatat hasil nyata, perubahan rancangan, validasi dan keterbatasan. Daftar rencana tetap pada [backlog](BACKLOG.md). Jangan menandai tugas selesai hanya karena file/endpoint placeholder tersedia.

## 9 November 2026 — tahap 01 / D0-01

**Hasil:** fondasi lokal berjalan. Frontend/backend terpisah sesuai struktur pengguna. Belum ada deployment.

### Kode dan konfigurasi

- Frontend Vue 3.5.45, Vite 8.3.6, plugin-vue 6.0.10; JavaScript, font sistem, CSS responsif dan halaman sementara dengan sidebar/header merah/biru.
- Express 5.3.0, MongoDB driver 7.8.0, dotenv 18.0.10, Helmet 8.3.0, CORS 2.8.6. Dependency dipin exact dan lockfile masing-masing tersedia.
- Config memvalidasi origin eksplisit, port dan batas database lingkungan; koneksi startup mem-ping MongoDB sebelum listen. Penutupan proses melepaskan koneksi.
- GET /health minimal/no-store; /ready internal loopback menguji ping, gagal 503; seluruh /api/v1 masih 401. Ini penutup sementara, bukan implementasi autentikasi/peran.
- Root script dev menjalankan dua aplikasi; db:dev memakai instance terpisah loopback 27027, tanpa Unix socket, data/log .local/mongodb yang diabaikan Git. Tidak menyentuh layanan/database default.
- Contoh env tanpa secret dan README untuk menjalankan. Halaman foundation memberi label Belum login/Belum diisi, tidak mengarang statistik bisnis atau login.

### Lingkungan teramati

Node 24.10.0, npm 11.6.0, mongod 8.0.15 tersedia di mesin. Tidak diupgrade global. .nvmrc mengarahkan Node 26; engines mendukung major 24.10+ dan 26. Runtime lokal bukan klaim versi terbaru. Fresh dependency diperiksa melalui tag registry npm saat bootstrap. Sebelum VPS tetap periksa patch/kompatibilitas aktual.

### Validasi yang dilakukan

| Pemeriksaan | Hasil |
| --- | --- |
| npm test | 8/8 lulus: config development, isolasi test/demo, port/origin invalid, health minimal, readiness gagal, namespace tertutup, CORS, JSON/payload |
| npm run build | Bundle frontend berhasil |
| GET API /health | 200 |
| GET API /ready | 200 dengan ping MongoDB development nyata |
| GET /api/v1/findings | 401, tidak ada data terekspos |
| GET frontend / dan /health via proxy | 200 |
| Browser desktop 1440×1000 / HP 390×844 | Tidak ada overflow horizontal; drawer buka/tutup dan refresh koneksi diperiksa |
| Console browser | Tidak ada error/warning yang tertangkap selama pemeriksaan |

Bukti screenshot lokal yang diabaikan Git: `.local/screenshots/stage-01-desktop.png` dan `stage-01-mobile.png`. Ini bukti halaman fondasi, bukan bukti fitur bisnis atau kesiapan produksi.

### Masalah yang ditemukan dan diperbaiki

MongoDB lokal dibatasi sandbox untuk socket/listener; pengujian diizinkan melalui eksekusi loopback terisolasi. Script menonaktifkan Unix socket agar tidak membuat socket di /tmp. Overlay drawer HP diperbaiki agar area tombol tutup tidak tertutup sidebar. Teks kecil diperbesar untuk keterbacaan.

### Batas dan langkah berikutnya

D0-01 saja selesai. D0-03 belum selesai walaupun kerangka visual awal tersedia: statistik bisnis dan akun login belum ada. Autentikasi, session store, CSRF, seed, CRUD/progres/audit bisnis, foto/PDF dan administrasi belum tersedia. Delapan tes fondasi bukan seluruh rencana T-01–T-24.

Tahap berikutnya D0-02 sesuai backlog. Proses uji frontend/backend dan MongoDB lokal dihentikan setelah verifikasi; data lokal dan screenshot tetap tersimpan. Pengguna dapat menjalankannya kembali lewat README. Operasi VPS/domain serta data perusahaan tidak disentuh. Perubahan berikutnya harus menyelaraskan dokumentasi terkait sebagaimana diminta pengguna.

## 9 November 2026 — sinkronisasi awal GitHub

- Pengguna menunjuk repo GitHub frontend/backend dan meminta dev/prod pada masing-masing repo. Kedua remote kosong pada pemeriksaan awal. Identitas Git yang sudah ada dipertahankan.
- Repo dipisah di folder aplikasi, tanpa repo induk. .gitignore lokal, README mandiri, .nvmrc dan AGENTS ditambahkan. Backend menyediakan npm run db:dev secara mandiri dan snapshot launcher induk di workspace/.
- Dokumen kanonis dipindahkan ke backend/docs; docs dan PROJECT_CONTEXT induk menjadi symlink, sehingga pembaruan dokumen tidak membutuhkan salinan dua PRD.
- Tidak ada perubahan fitur bisnis/dependency. Lockfile tetap sama; yang berubah adalah packaging standalone dan dokumentasi. Validasi staging/sinkronisasi mengikuti GIT_WORKFLOW.
- Git push/branch tidak mengubah status kesiapan produksi dan tidak menyiapkan deployment.

### Hasil unggahan awal

Frontend commit fondasi 8b25cf9 dan backend commit fondasi cadd492 berhasil diunggah ke masing-masing origin. Pada saat verifikasi awal, dev dan prod pada setiap repo cocok dengan SHA remote, memiliki upstream, dan working tree bersih. GitHub HEAD menunjuk dev pada kedua repo. Hasil ini dicatat dalam commit dokumentasi backend berikutnya; bukan perubahan fitur/deployment. Pemeriksaan 21 dokumen tidak menemukan tautan lokal rusak, syntax launcher valid, staging awal lolos pemeriksaan whitespace dan tidak memuat pola credential/runtime yang diperiksa.
