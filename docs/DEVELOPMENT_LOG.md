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

## 9 November 2026 — tahap 02 / D0-02: akun dan autentikasi

**Hasil:** D0-02 ditulis dan diuji lokal. Pengguna meminta lanjut coding dan commit setiap perubahan pada branch yang disepakati; kedua repo disinkronkan dengan origin/dev sebelum perubahan. Checkpoint frontend **e5d537f** berpasangan dengan commit backend yang memuat bagian catatan ini. Kerja pada dev; prod tidak dipromosikan dan tidak ada deployment.

### Implementasi

- Seed lokal non-destruktif: divisi Camp/Transport/ICT dan akun camp/transport/ict/admin.ict, satu admin terpisah. Argon2id 0.45.2 dipin exact pada package/lock (64 MiB, timeCost 3, parallelism 1). Kredensial acak hanya file .local/demo-accounts.json, mode 0600 dan diabaikan Git; tidak dicetak ke log/ditanam di source. Belum seed temuan.
- Sesi MongoDB opaque: token acak 256 bit, hanya hash SHA-256 tersimpan sebagai ID, CSRF terikat sesi, masa absolut 12 jam dan TTL cleanup. Akun aktif/sessionVersion/peran dibaca setiap request. Login baru merotasi sesi cookie lama; beberapa perangkat tetap didukung; logout mencabut sesi saat ini.
- Endpoint login/me/logout, baca divisi, baca akun admin. Guard server 401 anonim dan 403 divisi ke admin, pemeriksaan Origin + CSRF mutasi, allowlist input/query, rate limit MongoDB 15 menit per username/IP (persisten setelah API restart), no-store dan respons tanpa rahasia. Cookie demo __Host-/Secure dengan origin HTTPS; lokal memakai nama development.
- Frontend / mengganti halaman fondasi menjadi form login dan ringkasan akun/divisi sebenarnya. Fetch credentials, CSRF di memori, timeout, penanganan galat, identitas header/avatar, refresh sesi saat reload/fokus, timer expiry dan pencegahan respons me terlambat menghidupkan ulang UI sesudah logout. Belum router/dashboard bisnis.
- README kedua repo dan induk lokal, salinan petunjuk workspace, PRD/backlog, API/data/akses/arsitektur/UI, tes, keputusan, indeks dan konteks terbaru diselaraskan. Instruksi menjalankan kini mencakup seed dummy dan URI test eksplisit.

### Validasi nyata

- `MONGODB_TEST_URI=mongodb://127.0.0.1:27027 npm test`: **26 lulus, 0 gagal, 0 dilewati**. Suite memakai database test unik, kemudian hanya database itu dibersihkan. Tanpa env, suite integrasi dilewati dan 9 tes fondasi/config tetap berjalan.
- Cakupan: hash/sandi, payload Mongo dan spoof role, Origin/login, anonim 401, divisi-admin 403, admin list tanpa rahasia, CSRF salah/antar sesi, logout satu perangkat, rotasi sesi, expiry sebelum TTL cleanup, nonaktif/sessionVersion, rate limit username/IP termasuk spoof X-Forwarded-For, persistensi limit setelah router restart, dan header cookie Secure/logout. Tes cookie Secure masih loopback/header, bukan bukti deployment HTTPS cross-subdomain.
- `npm run build` frontend lulus sesudah perubahan akhir. `git diff --check` kedua repo lulus. Instalasi npm melaporkan 0 vulnerability pada saat pemasangan; ini bukan audit keamanan menyeluruh.
- Browser lokal: sandi salah ditolak, login Camp berhasil dengan divisi backend, refresh mempertahankan sesi, logout kembali ke form, refresh sesudah logout tetap anonim, Admin ICT via keyboard Enter menampilkan role benar. HP 390px: form/akun tanpa overflow horizontal, drawer buka/tutup. Satu percobaan klik segera setelah animasi drawer belum memicu logout; klik ulang setelah drawer tertutup berhasil. Tidak ditemukan error konsol saat pemeriksaan.
- Seed dijalankan ulang: dokumen akun identik (sandi/status/versi/timestamp tetap), kredensial mode 0600. Pembacaan fixture mengonfirmasi **3 divisi, 4 akun Argon2id, 1 ADMIN, 0 temuan**. Screenshot lokal `.local/d0-02-login.png` tidak ikut Git, bersama file kredensial/database/log. Dev server frontend/backend dan MongoDB khusus proyek dibiarkan aktif untuk review lokal.

### Batas dan tahap berikutnya

D0-01/D0-02 selesai; seluruh D0/MVP belum selesai. Mutasi membuat/reset/nonaktif akun dan audit administrasinya tetap M-06; revokasi pada tes menggunakan perubahan database test. Belum CRUD/status/audit temuan, konflik versi bisnis, foto, PDF atau dashboard. API fitur yang belum ditulis memberi 404 setelah autentikasi/otorisasi, bukan respons sukses palsu.

Berikutnya **D0-03**: dashboard pembuka dan kerangka navigasi dengan sumber data backend. Tetap data dummy. Hosting, trust proxy, HTTPS lintas subdomain, beban Argon2 pada VPS, backup/restore serta izin perusahaan belum diverifikasi. Tidak menyatakan siap produksi.

## 9 November 2026 — tahap 03 / D0-03: dashboard ringkas

**Hasil:** pengguna sudah mencoba login tahap 02 dan mengonfirmasi berhasil, lalu meminta tahap berikutnya. D0-03 ditulis dan diuji lokal pada dev setelah pull --ff-only kedua repo (sudah up to date). Checkpoint frontend **3df3f66** berpasangan dengan commit backend yang memuat catatan ini; tidak mempromosikan prod atau menjalankan deployment.

### Implementasi

- GET /api/v1/dashboard dilindungi guard sesi dan pemeriksaan fail-closed pada router dashboard. Semua akun divisi/admin bisa melihat seluruh scope; filter adalah OR divisi penanggung jawab, bukan pembatasan akses berdasarkan akun.
- Satu aggregate MongoDB menghitung total valid, Diproses/Tertunda/Selesai, terbuka/terlambat dan masuk/selesai bulanan. Tanpa unwind penanggung jawab; data batal dikecualikan. Snapshot semua tanggal, month hanya indikator periodik. completedAt dihitung pada APP_TIMEZONE; target kosong/hari ini dan pekerjaan Selesai tidak terlambat. APP_TIMEZONE tidak valid ditolak sebelum listen.
- Allowlist query month/responsibleDivisionIds, format ketat, maksimum 50 ID, deduplikasi dan maxTimeMS 5 detik. Hasil kosong benar-benar nol; galat database mengembalikan 500 tanpa angka nol/detail koneksi palsu. Hanya agregat yang dikirim, tanpa uraian/pelapor/audit/rahasia akun.
- Seed yang sama kini menambah 18 temuan dummy secara insert-only berdasarkan seedKey unik: 16 tidak batal, 2 batal, beberapa penanggung jawab bersama, prioritas/target kosong, hari ini/lewat dan laporan bulan sebelumnya. Aktor sistem DEMO_SEED dibedakan dari audit akun pengguna; belum audit bisnis/endpoint tulis. Akun/sandi tahap 02 tidak berubah.
- Vue DashboardView sebagai beranda setelah login di route /. Empat kartu, indikator fokus tindak lanjut, dua angka bulanan, filter multi-divisi/bulan, Reset/Terapkan/Perbarui, timestamp dan label demo. Loading/kosong/galat dibedakan; angka lama disembunyikan saat memuat/gagal, respons sesudah unmount diabaikan. Filter sukses disimpan ke query URL untuk refresh. Header memuat identitas/peran/avatar dan Keluar; drawer tetap untuk HP. Tidak menambah dependency/router sebelum halaman daftar/detail diperlukan.
- README kedua repo/induk lokal dan petunjuk workspace, PRD, backlog, UI/API/data/akses/arsitektur, test plan, keputusan, indeks dan konteks terbaru diselaraskan. M-04 baru sebagian; D0-04 belum selesai walaupun dashboard sudah punya filter divisi.

### Validasi nyata

- `MONGODB_TEST_URI=mongodb://127.0.0.1:27027 npm test`: **37 lulus, 0 gagal, 0 dilewati** (regresi autentikasi + dashboard/seed/kalender). Database test unik auth/dashboard dibersihkan setelah suite; DB development tidak dipakai sebagai fallback. Tanpa URI, dua suite integrasi dilewati, 12 tes unit/fondasi/config berjalan.
- Cakupan baru: anonim 401, nol saat kosong, status semua tanggal, temuan bersama dihitung sekali, batal dikecualikan, target hari ini/null/Selesai tidak terlambat, completedAt tepat sebelum/sesudah pergantian bulan Asia/Jakarta, status aktif dengan timestamp lama tidak dihitung selesai, perubahan bulan tidak mengubah snapshot, scope kosong/ID tidak dikenal, query salah/injeksi/berulang, guard ketika router salah pasang, dan galat agregasi 500 tanpa rahasia. Kalender meliputi tengah malam, pergantian tahun dan kabisat.
- Seed uji 18 fixture diulang setelah suntingan/kenaikan versi/audit serta clock maju 40 hari: dokumen tetap sama, nonfixture tetap ada. Pada development, seed menambah tepat 18 temuan; rerun tidak mengubah dokumen akun maupun temuan. Tidak mengubah kredensial lama.
- Fixture awal scope semua: **16 total, 6 Diproses, 5 Tertunda, 5 Selesai, 11 terbuka, 5 terlambat**. Bulan November 2026 saat seed: 9 masuk/5 dicatat selesai. Ini hasil baca MongoDB pada waktu seed, bukan angka UI hardcode; keterlambatan/angka bulan dapat berubah seiring tanggal.
- `npm run build` frontend lulus (13 modul); whitespace diff kedua repo dan tautan lokal dokumentasi lulus. Tidak ada dependency baru. Screenshot lokal .local/d0-03-dashboard.png dan .local/d0-03-dashboard-mobile.png diabaikan Git.
- Browser: Camp/Admin ICT masuk ke dashboard dengan identitas benar; Camp+ICT menghasilkan 12 temuan unik, pindah Oktober mengubah indikator tanpa mengubah snapshot. Refresh mempertahankan checkbox/bulan via URL, Reset kembali semua divisi/bulan server, Perbarui memuat kembali, Keluar mengembalikan login. ID divisi tak dikenal menampilkan state kosong nol; bulan tidak valid menampilkan galat tanpa kartu angka dan pulih lewat Reset. HP 390px: document.scrollWidth=innerWidth=390, drawer buka/tutup dan filter Transport melalui Space/Enter berhasil. Viewport dikembalikan ke default setelah uji. Proses lokal frontend/backend/MongoDB khusus proyek tetap berjalan untuk review.

### Batas dan langkah berikutnya

D0-01–D0-03 selesai; seluruh D0/MVP belum selesai. **Berikutnya D0-04:** daftar rapat, pencarian, filter multi-divisi, ringkasan unik dan pagination. CRUD/progres/validasi bisnis/audit/konflik mengikuti D0-05/D0-06. Grafik per-divisi/tren enam bulan/daftar tindak lanjut maksimal lima tetap M-04. Belum foto, PDF, mutasi admin, hosting HTTPS atau pengujian proyektor/perangkat/jaringan kantor. Data tetap dummy dan belum izin operasional perusahaan.

## 9 November 2026 — tahap 04 / D0-04: daftar rapat

**Hasil:** pengguna meminta lanjut pengembangan. D0-04 ditulis dan diuji pada dev setelah pull --ff-only kedua repo (up to date). Frontend checkpoint **ca35aa3** berpasangan dengan commit backend yang memuat catatan ini. Prod tidak dipromosikan; tidak ada tindakan deployment.

### Implementasi

- GET /api/v1/findings dan /findings/summary setelah guard sesi, fail-closed tambahan pada router. Baca lintas divisi sesuai keputusan pengguna, termasuk nama pelapor. Tidak menambah endpoint detail/tulis, izin approval atau pembatasan berdasarkan divisi akun.
- Parser/filter builder bersama: scope OR beberapa divisi maksimal 50, pencarian literal case-insensitive pada kondisi/lokasi/pelapor/referensi maksimal 100, status/prioritas/divisi pelapor, rentang kalender inklusif dengan dasar laporan/selesai, active/cancelled/all, sort allowlist dan pagination 1–999999 / pageSize 1–100. Input/operator/array/query berulang/tanggal salah ditolak. Dasar selesai mensyaratkan status kini COMPLETED; tidak menimpa status filter lain.
- List memadukan baris halaman dan summary seluruh filter dalam satu facet MongoDB; tidak unwind penanggung jawab. Data batal dihitung terpisah, tidak masuk totalValid/kartu status/terbuka/terlambat. Summary API terpisah menggunakan builder yang sama, tanpa pagination. Projection allowlist membuang audit/progres/foto/secret; uraian ringkas 240, nama master divisi historis tetap dapat dibaca. Badge Baru hari 0–6 dan Terlambat dihitung server, bukan disimpan atau dianggap status baru. Dua indeks urutan ditambahkan. maxTimeMS 5 detik, galat 500 tidak disamarkan sebagai hasil kosong.
- Vue Router 4.6.4 exact untuk /login, /dashboard, /findings; / mengarah ke dashboard dengan query lama. Latest major 5 yang sempat terpasang menuntut patch Node lebih baru melalui dependency Babel 8, sehingga diganti stable major 4 yang kompatibel dengan Node 24.10 lokal; tidak upgrade global. Lockfile akhir mengunci pilihan kompatibel.
- Daftar dengan filter dasar/lanjutan dapat dilipat, empat kartu seluruh hasil filter, data batal terpisah, tabel enam kolom desktop dan kartu HP, badge teks, target/prioritas kosong, timestamp, pagination/ukuran halaman. Filter/page tersimpan di URL, perubahan filter mulai page 1, reset juga membuang draf belum diterapkan. Empty/error/page kosong dibedakan; tidak ada tombol CRUD/detail/PDF semu.
- App memulihkan sesi sebelum halaman privat, 401 mengembalikan login, tujuan setelah login hanya dashboard/daftar internal yang diimplementasikan. Dashboard beralih ke query router; Back/refresh tetap bekerja, respons route lama/unmount diabaikan, judul tab/side menu sesuai halaman. Dua tes frontend menjaga encoding query berulang dan pencegahan tujuan login eksternal/malformed.
- README kedua repo/induk lokal dan petunjuk workspace, PRD/API/UI/data/akses/arsitektur, backlog/test plan/indeks/keputusan/konteks diperbarui. Filter lanjutan/badge dan filter baca batal baru sebagian M-01/M-03, bukan seluruh validasi form atau aksi pembatalan/audit selesai.

### Validasi nyata

- `MONGODB_TEST_URI=mongodb://127.0.0.1:27027 npm test`: **51 tes backend lulus, 0 gagal, 0 dilewati**. Suite auth/dashboard/findings memakai database test unik masing-masing, lalu hanya DB test itu dibersihkan. Tanpa URI, 15 tes unit/fondasi/config berjalan dan 3 suite integrasi dilewati. Fixture development dan sandi tidak diubah pada tahap baca ini.
- Cakupan baru: anon 401/fail-closed, revokasi sesi untuk list/summary, data kosong, pagination stabil/tie-breaker, page melampaui hasil, summary seluruh filter sama antar halaman, scope OR unik/ID tak dikenal/divisi historis nonaktif, baca lintas divisi, pencarian regex literal dan q beberapa field, prioritas/status, tanggal inklusif dan tengah malam Asia/Jakarta, status vs basis selesai tidak tertimpa, active/all/cancelled, badge 0/6/7/future serta null/hari ini/Selesai, input/operator/parameter berulang salah, projection tanpa histori/storage/secret, galat pembacaan 500 tanpa detail internal.
- Frontend `npm test`: **2 lulus**. `npm run build`: lulus (34 modul). Build awal menangkap salah penutup markup option yang sudah diperbaiki sebelum validasi akhir; overlay HMR lama hilang setelah reload. Diff whitespace dan tautan lokal dokumentasi lulus. Instalasi akhir vue-router 4.6.4 tanpa peringatan engine; npm melaporkan 0 vulnerability saat pemasangan, bukan audit keamanan menyeluruh.
- Browser Admin ICT/Camp: list default 16 valid (6/5/5), Camp+ICT **12 unik** dengan ukuran 5 menjadi tiga halaman; halaman kedua 6–10 dari 12 dengan angka tetap 12/6/1/5. Back dan refresh memulihkan page/checkbox, pencarian panel pada scope itu menghasilkan 3, pencarian tak cocok memberi empty, Reset menghapus draf pencarian yang belum diterapkan.
- Filter batal saja: 2 baris berlabel Dibatalkan, seluruh kartu valid nol, cancelled=2. Filter semua: 18 baris dengan kartu 16/6/5/5. Status NEW dari URL memberi galat tanpa kartu angka, pulih lewat Reset. Logout dan deep link /findings?pageSize=5 tanpa sesi menuju login, lalu Camp kembali ke URL/ukuran halaman yang diminta. Dashboard tetap 16/6/5/5 sesudah navigasi baru.
- Desktop 1440px: document.scrollWidth=innerWidth=1440, enam kolom terlihat dan lima baris halaman pertama diperiksa. HP 390px: document.scrollWidth=innerWidth=390, kartu/filter terbaca, drawer dan navigasi Dashboard/Back berhasil. Viewport dikembalikan ke default. Pembacaan log konsol pada verifikasi akhir kosong (warn/error). Screenshot .local/d0-04-findings.png dan .local/d0-04-findings-mobile.png diabaikan Git, bersama kredensial/database/log. Proses lokal tetap aktif untuk review.

### Batas dan langkah berikutnya

D0-01–D0-04 selesai; seluruh D0/MVP belum selesai. **Berikutnya D0-05:** tambah/detail/koreksi, progres/status, target/prioritas opsional; D0-06 menambahkan audit bisnis dan konflik versi. Belum aksi batal/pulihkan/admin akun, foto/PDF atau dashboard lengkap M-04. Metadata DEMO_SEED bukan audit edit pengguna. History mode memerlukan rewrite hosting; deep link baru diuji di Vite lokal, bukan Vercel/HTTPS/proyektor kantor. Tetap data dummy, belum izin penggunaan operasional perusahaan.

## 9 November 2026 — tahap 05 / D0-05: pencatatan, koreksi dan progres

**Hasil:** D0-05 ditulis dan diuji lokal pada dev setelah pull --ff-only kedua repo (up to date). Pengguna meminta cek ulang karena sempat terkena limit; pemeriksaan menemukan kode/spesifikasi tersimpan tetapi belum commit/push dan log tahap ini belum ada. Tes/build diverifikasi ulang lalu checkpoint dilengkapi. Commit frontend **7a3dfe6** berpasangan dengan commit backend yang memuat catatan ini; tidak mempromosikan prod atau melakukan deployment.

### Implementasi

- Endpoint POST create, GET detail, PATCH core dan POST progress setelah sesi aktif/CSRF/Origin. Validasi allowlist server: tipe/ID/UUID v4, tanggal kalender tidak future, panjang teks, 1–50 penanggung jawab unik/aktif, reporter division, prioritas enum, target opsional tidak sebelum laporan. Actor/waktu/status awal/audit/receipt tidak diterima dari payload. Referensi historis nonaktif yang tidak berubah boleh tetap dipakai; referensi baru harus aktif.
- Awal IN_PROGRESS/version=1. ON_HOLD wajib holdReason; kembali aktif/selesai mengosongkan alasan aktif, nilai lama tetap audit. COMPLETED mengisi completedAt server saat transisi, tanpa foto/approval; koreksi ke aktif membutuhkan correctionReason dan mengosongkan completedAt. Kejadian berulang tetap temuan baru. Progres append-only; tanpa perubahan/catatan ditolak. Temuan batal read-only.
- Fondasi integritas D0-06 didahulukan pada write pertama: before/after, actor akun/snapshot nama divisi, progres, receipt dan increment version dalam satu write kondisional _id+expected version+tidak batal. Konflik 409 memberi currentVersion tanpa overwrite. Indeks createMutationId unik parsial, requestHash terikat akun/jenis/payload, retry identik mengembalikan acknowledgement asli walaupun ada versi lebih baru; payload/akun berbeda pada ID sama 409. Candidate BSON >8 MiB dihentikan tanpa memangkas histori. Audit event menautkan progressEntryId bila ada teks.
- Kontrak mutasi diselaraskan: acknowledgement id/reference/version/status/updatedAt, lalu GET detail untuk keadaan terkini. Menghindari snapshot detail/progres duplikat dalam setiap receipt dan menjaga retry memberi hasil asli. Detail serialisasi allowlist dengan 10 progres terbaru/progressTotal/attachmentCount, tanpa audit/receipt/hash/password/storageKey. GET audit/progres paginasi belum tersedia.
- Vue menambah /findings/new, /findings/:id, /findings/:id/edit; Tambah temuan/Buka detail/Koreksi informasi dan form progres berfungsi. Pelapor dibedakan dari akun pencatat/pengubah, status bersama dijelaskan, Selesai meminta checkbox pemahaman untuk seluruh penanggung jawab. Target/prioritas kosong dan tanpa foto sah. Error field berlabel manusia; notice sukses hanya sesudah acknowledgement dan sekali per akun/temuan, bukan query URL.
- Cache draft memori tab keyed akun/resource, tidak localStorage. Hasil network/5xx tidak pasti mengunci isian dan memakai payload/mutationId sama ketika retry. Konflik menjaga teks/isian, menghentikan save, menyediakan versi terbaru di tab lain dan explicit discard+reload setelah peringatan. Draft yang tidak diedit mengikuti versi terbaru; draft berubah mempertahankan versi awal. Navigasi diblok saat write, browser memberi peringatan sebelum meninggalkan draft. Refresh/tutup tab menghapus cache; tidak mengklaim tahan gangguan/offline atau merge konflik lengkap.
- README kedua repo/induk lokal dan workspace, backlog/PRD, API/data/akses/arsitektur/UI/alur, tes, indeks/keputusan/konteks terbaru diselaraskan. Tidak menambah dependency atau mengubah runtime/hosting/sandi/fixture seed lama.

### Validasi nyata

- Verifikasi akhir (termasuk setelah permintaan cek ulang akibat limit): `MONGODB_TEST_URI=mongodb://127.0.0.1:27027 npm test`: **62 lulus, 0 gagal, 0 dilewati**. Suite auth/dashboard/findings/write memakai database test unik lalu hanya DB tersebut dibersihkan. Tanpa URI, 15 tes unit/fondasi/config berjalan dan 4 suite integrasi dilewati.
- Cakupan baru: anonim/CSRF/Origin, spoof actor/status, input tanggal/field/ID objek tidak valid, divisi aktif/historis, default kosong/tanpa foto, retry create/progres serentak tanpa ganda, payload/akun salah memakai mutationId sama, koreksi lintas divisi, audit before/after dan nama snapshot tetap setelah master berubah, stale version, status/alasan/completedAt, dua write versi sama satu sukses, pembacaan tanpa receipt/secret, batal/ID hilang dan guard ukuran histori tanpa write parsial. Regresi login/daftar/dashboard tetap lulus.
- Frontend `npm test`: **5 lulus** (URL/tujuan internal termasuk form/detail, cache draft lintas remount dan akun, payload/ID retry tidak pasti, reset setelah 4xx, notice sukses sekali). `npm run build`: lulus (38 modul). Diff whitespace dan tautan lokal dokumen diperiksa. Tidak membuat tes yang hanya menyalin markup.
- Browser Camp: membuat satu temuan jelas dummy D0-05 tanpa target/prioritas/foto, dua penanggung jawab Camp/ICT, pelapor Transport berbeda dari pencatat. Default Diproses; data bertahan refresh. Koreksi lokasi tersimpan; Tertunda tanpa alasan tertahan validasi form, tunda dengan alasan+catatan berhasil, kembali Diproses dengan prioritas/target lalu Selesai tanpa foto berhasil. Waktu selesai server dan 3 catatan progres tetap setelah refresh. Koreksi Selesai ke aktif tanpa alasan tertahan form; tidak mengubah status tersimpan.
- Dua tab pada temuan dummy yang sama: write pertama diterima, write kedua 409 dengan teks draft tetap terlihat dan tombol simpan dihentikan. Discard+reload eksplisit memuat status terbaru/draft kosong; tooling sempat perlu retry keyboard saat berinteraksi dengan konfirmasi native, hasil akhir pemuatan ulang teramati. Tidak ada draft konflik yang ikut tersimpan sebagai progres.
- Daftar q=D0-05: tepat 1 hasil, kartu 1 total/0 Diproses/0 Tertunda/1 Selesai. Desktop 1440px dan HP 390px detail/form koreksi: document.scrollWidth=innerWidth, tanpa overflow horizontal. Screenshot lokal .local/d0-05-detail.png, d0-05-detail-mobile.png, d0-05-form-mobile.png dan d0-05-conflict.png diabaikan Git. Viewport dikembalikan ke default; log konsol akhir warn/error kosong. Proses lokal tetap aktif untuk review.
- Pembacaan development setelah uji: 19 temuan (18 fixture + 1 manual), 17 valid/2 batal, status 6 Diproses/5 Tertunda/6 Selesai, 11 terbuka/5 terlambat. Temuan manual version=5, 3 progres, 5 audit/5 receipt dan createdBy akun camp. Ini hasil waktu uji, bukan konstanta frontend. Akun/sandi dan 18 fixture tidak diubah.

### Batas dan langkah berikutnya

D0-01–D0-05 selesai; D0-06 baru sebagian. **Berikutnya D0-06:** API/UI audit before/after lengkap dan progres yang dipaginasi, kompatibilitas histori DEMO_SEED lama serta peninjauan konflik/draft yang lebih baik. Saat ini maksimal 10 progres, audit tersimpan tetapi belum UI lengkap; pemulihan draft tahan refresh/sesi berakhir penuh belum diverifikasi end-to-end. Batal/pulihkan, foto/PDF/admin mutasi/dashboard lengkap, hosting/backup/UAT perusahaan masih belum selesai. Seluruh data tetap dummy, belum izin operasional atau bukti siap produksi.

## 9 November 2026 — tahap 06 / D0-06: riwayat dan konflik

**Hasil:** frontend commit `af7a645` berpasangan dengan commit backend tahap ini. GET riwayat audit dan progres per temuan dengan page/pageSize ketat, terbaru dahulu, potongan array pada MongoDB, tanpa receipt/hash/mutationId. Event akun menampilkan before/after, aktor akun divisi, alasan koreksi, tautan catatan dan snapshot nama divisi; DEMO_SEED lama ditandai tanpa mengarang nilai before/after. Detail Vue menampilkan kedua jenis riwayat per 10 item dengan navigasi halaman dan state kosong/galat.

Konflik koreksi/progres kini membaca versi terbaru dan membandingkan nilai semula, draf, serta server. Tindakan rebase manual mempertahankan field yang diubah pada draf dan mengambil nilai server pada field yang belum diubah; versi dan mutationId berikutnya baru setelah peninjauan. Buang draf tetap eksplisit. Retry hasil tidak pasti tetap memakai payload/ID lama, tanpa menganggapnya konflik. Ini bukan merge otomatis pada field sama dan draf masih memori tab.

**Validasi:** MongoDB test terisolasi: 63 tes backend lulus termasuk lebih dari 10 catatan, dua halaman, parameter salah/berulang, anon 401, ID 404, event create, dan fixture seed lama. Frontend 6 tes lulus termasuk rebase field serta build Vite 40 modul lulus. `git diff --check` diperiksa. Tes awal backend tanpa eskalasi sandbox gagal membuka port loopback (EPERM); rerun dengan izin lokal berhasil. Browser manual D0-06 belum diuji, demikian juga proyektor/HP di lingkungan kantor. Tidak ada deployment, data operasional, perubahan prod, atau klaim siap produksi.

**Berikutnya:** D0-07, uji skenario presentasi end-to-end dengan data dummy dan catat kekurangan nyata. Foto, PDF, pembatalan/pemulihan, mutasi admin dan dashboard lengkap masih tahap berikutnya.

## 9 November 2026 — tahap 07 / D0-07: uji alur presentasi lokal

**Hasil:** frontend commit `4e78793` berpasangan dengan commit backend dokumentasi tahap ini. Browser localhost dengan akun Camp menguji dashboard, filter Camp+Transport, create dummy tanpa target/foto, status Tertunda (alasan wajib), Selesai, riwayat before/after dan progres dua halaman. Pada saat filter, 17 valid semua divisi menjadi 13 hasil unik Camp+Transport. Temuan dummy `SM-2026-6af1c29b794eabcf6e453600` dibuat. Sembilan catatan tambahan menghasilkan 11 progres dan 12 audit untuk menguji halaman kedua; tidak ada duplikasi atau pemotongan yang teramati. Audit create/status/progres menampilkan akun, waktu, nilai sebelum/sesudah dan snapshot divisi.

**Bug dan perbaikan:** konflik dua tab menampilkan perbandingan dengan benar tetapi rebase gagal karena `structuredClone` menerima proxy reaktif Vue. Browser log menunjukkan `DataCloneError`. Penyalinan form diganti salinan field/array sederhana; tes proxy reaktif ditambah. Setelah perbaikan, rebase progres mempertahankan catatan/prioritas draf dan simpan berhasil. Rebase koreksi menjaga lokasi draf dan mengadopsi uraian terbaru dari tab kedua; simpan berhasil. Label prioritas konflik diterjemahkan ke bahasa Indonesia. Teks dashboard/daftar yang masih menyebut riwayat belum tersedia diperbarui, badge tahap diganti “Demo alur rapat”.

**Akses lintas divisi:** akun dummy ICT login ke API lokal, mengoreksi lokasi temuan yang dibuat Camp dan audit mencatat actor `ict`, before/after, revisi 17. Kredensial tidak dicetak atau disimpan di Git. Sesi uji ICT di-logout. Data dummy uji tetap di DB development untuk demo; seed 18 fixture, akun dan sandi lama tidak diubah.

**Validasi akhir:** 7 tes frontend, build Vite 40 modul, 63 tes backend MongoDB test terisolasi dan `git diff --check` lulus.

**Batas verifikasi:** browser uji tetap 841 px ketika viewport override 390 dan 1440 dicoba, sehingga D0-07 tidak mengklaim uji layar HP/proyektor pada ukuran tersebut. Belum ada presentasi leader, uji jaringan kantor/HTTPS, atau keputusan pilot. Foto/PDF, batal/pulihkan, admin mutasi dan dashboard lengkap masih D1/D2. Ini bukan izin data operasional atau bukti siap produksi.

## 21. 10 November 2026 — D1 / M-03: pembatalan dan pemulihan

Pengguna mengonfirmasi demo sejauh ini sesuai rancangan dan meminta lanjut develop. Frontend checkpoint **aa89817** berpasangan dengan commit backend yang memuat catatan ini. Backend menambah POST /findings/:id/cancel dan /restore: alasan wajib 1–2000 karakter, version dan mutationId UUID v4, role ADMIN untuk restore, status batal terpisah dari status pekerjaan. Kedua aksi memakai audit before/after, actor akun, snapshot nama divisi, versi kondisional, receipt idempoten, serta batas ukuran histori 8 MiB. Detail mengirim cancelledBy, riwayat mengirim reason. Frontend menambah form batal/pulih, alasan, penanganan konflik/retry, identitas pembatal dan event audit. Data batal tetap read-only dan dapat difilter; dashboard/list valid mengecualikannya. Tidak ada hapus permanen.

Validasi: `MONGODB_TEST_URI=mongodb://127.0.0.1:27027 npm test` 64/64 lulus setelah MongoDB development lokal dijalankan; `npm test` frontend 7/7 dan `npm run build` lulus. Integrasi memeriksa alasan wajib, spoof/anonim/CSRF, role restore 403, transisi 409, retry identik, write pada data batal, filter, ringkasan dan audit. Browser lokal dengan akun dummy admin membatalkan lalu memulihkan satu temuan dummy; event terbaru menunjukkan alasan, actor serta before/after, tanpa error konsol. Foto/PDF, dashboard M-04, mutasi admin, perangkat kantor, hosting/HTTPS dan data nyata belum diuji/selesai. Tidak menyentuh prod atau deploy.

## 22. 10 November 2026 — D1 / M-02: foto opsional privat

Frontend checkpoint **a4ac753** berpasangan dengan commit backend yang memuat catatan ini. POST/GET list/GET file foto temuan ditambahkan. Berkas JPEG/PNG/WebP sampai 5 MiB diparse multipart dengan batas, dibuka penuh oleh decoder Sharp, ditolak bila tipe isi tidak cocok/animasi, lalu diputar sesuai orientasi dan disimpan WebP tanpa metadata di folder privat (default development `.local/uploads`, dapat diubah dengan UPLOAD_DIR absolut). Maksimal 10 foto/temuan; tidak ada penghapusan. Metadata, audit ATTACHMENT_ADDED dan receipt idempoten ditulis bersama versi MongoDB kondisional. File baru dibersihkan jika write gagal. Baca hanya setelah sesi aktif; data batal tetap dapat melihat foto, unggahnya ditolak. UI detail menampilkan galeri dan form unggah, draf file hanya memori tab. Laporan teks/status selesai tetap sah tanpa foto.

Validasi: 65/65 tes backend dengan MongoDB test, 7/7 frontend dan build lulus. Tes baru memakai PNG dummy, memeriksa tanpa sesi/CSRF, isi palsu/terlalu besar, unggah, retry tanpa duplikasi, versi stale dan batas 10, baca WebP, audit, baca saat batal dan penolakan unggah saat batal. Browser lokal dengan akun Admin ICT mengunggah PNG dummy pada temuan dummy D0-07: notice berhasil, satu foto tampil dan piksel gambar berhasil dimuat, riwayat mencatat ATTACHMENT_ADDED versi 20. Belum ada uji volume/backup/restore, HTTPS, perangkat kantor, atau data/foto operasional. Tidak menyentuh prod/deploy.

## 23. 10 November 2026 — M-06 sebagian: admin ICT berbeda dari akun divisi

Pengguna menanyakan perbedaan admin ICT dan akun divisi karena menu tampak sama. Frontend checkpoint **4fca003** berpasangan dengan commit backend yang memuat catatan ini. Sebelumnya role ADMIN hanya berbeda di server: baca akun dan pulihkan temuan batal; UI administrasi belum ada. Tahap ini menambah `/admin/accounts` khusus ADMIN pada UI dan POST/PATCH/reset-password akun divisi pada API. Admin dapat membuat akun DIVISION, melihat versi/status, mereset sandi, menonaktifkan atau mengaktifkan. Login/sesi divisi langsung ditolak setelah reset/nonaktif melalui sessionVersion dan penghapusan sesi. Password hash Argon2id; sandi tidak dikirim dalam respons, audit atau log. Audit ACCOUNT_CREATED/ACCOUNT_UPDATED/PASSWORD_RESET dan receipt mutationId menjaga perubahan versi/retry. Admin tambahan, perubahan akun admin, dan master divisi belum dibuka dalam tahap ini.

Validasi: 66 tes backend MongoDB, 7 tes frontend dan build lulus. Tes integrasi MongoDB memeriksa 403 akun divisi, pembuatan, retry, login akun dummy, reset, revokasi sesi, nonaktif/replay, dan audit tanpa sandi. Browser lokal menampilkan menu/halaman Kelola akun bagi Admin ICT dengan empat akun dummy. Tidak mengubah akun demo yang ada dalam browser; mutasi diuji hanya di DB test. Tetap dev/data dummy, tanpa deploy/prod.

## 24. M-06 — master divisi admin ICT

Checkpoint frontend `b5b4633` berpasangan dengan commit backend yang memuat catatan ini. Endpoint GET/POST/PATCH `/api/v1/admin/divisions` dan halaman `/admin/divisions` ditambahkan pada dev. ADMIN saja dapat membuat, mengganti nama, dan aktif/nonaktif; tidak ada hard delete atau ubah kode. Nama unik case-insensitive, audit before/after, versi CAS dan retry idempoten mengikuti fondasi administrasi. Penonaktifan ditolak bila akun DIVISION masih aktif. Aksi di UI memperbarui pilihan divisi global. 67 tes backend MongoDB test terpisah, 7 tes frontend dan build lulus. Database development awalnya kosong; setelah seed dummy idempoten, login Admin ICT dan GET master divisi berhasil 200. Tampilan setelah login dan mutasi UI belum diuji. Data dummy, tanpa prod/deployment. Akun ADMIN lain dan perubahan akun ADMIN belum dicakup; kewenangan itu perlu keputusan terpisah. Berikutnya M-04 dashboard lengkap atau M-05 PDF sesuai kebutuhan demo.
