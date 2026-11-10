# Konteks proyek: pencatatan dan tindak lanjut kondisi tidak aman

Disusun dari percakapan pengguna pada 9 November 2026. Nama folder adalah nama kerja, bukan nama produk final. Dokumen ini adalah bekal untuk melanjutkan proyek, bukan spesifikasi yang seluruh rinciannya telah disetujui perusahaan.

**Panduan membaca terbaru:** bagian 1–10 menyimpan percakapan awal. Keputusan pada bagian 11 dan seterusnya menggantikan usulan awal yang bertentangan. Untuk kebutuhan implementasi saat ini, mulai dari bagian paling akhir dan `docs/README.md`; jangan menganggap teknologi, akun, atau status masih belum dipilih hanya karena disebut demikian dalam arsip awal.

## 1. Tujuan yang sudah dikonfirmasi pengguna

- Membuat aplikasi web untuk digunakan secara internal di satu perusahaan, yaitu tempat pengguna bekerja.
- Mempermudah pencatatan, pencarian, penyajian, dan pemantauan tindak lanjut kondisi tidak aman.
- Menyediakan tampilan yang menarik, mudah diakses, dan membantu rapat serta keputusan manajemen.
- Memungkinkan divisi memperbarui progres sebelum rapat; pembaruan juga dapat dilakukan ketika rapat berlangsung.
- Proyek juga menjadi kontribusi pengguna sebagai IT Support dan bahan portofolio. Imbalan finansial bukan syarat untuk melanjutkan.
- Fokus saat ini bukan penjualan ke perusahaan lain, monetisasi, atau membangun SaaS banyak perusahaan.

## 2. Proses yang berjalan sekarang

Temuan dicatat menggunakan Microsoft Word. Contoh temuan: kondisi yang tidak sesuai SOP, panel listrik rusak, pohon terlalu tinggi yang perlu dipangkas, jembatan rusak, dan tangga yang hampir patah.

Rapat berlangsung beberapa kali sebulan; pengguna memberi contoh sekitar tiga kali dalam sebulan. Peserta ditunjuk satu per satu untuk menyampaikan temuan. Dokumen Word ditampilkan melalui proyektor agar semua peserta dapat melihatnya.

Data yang biasa dicatat:

- Kondisi atau uraian temuan.
- Nama pelapor.
- Lokasi.
- Divisi yang bertanggung jawab menyelesaikan.

Rapat juga meninjau temuan sebelumnya: apakah sudah selesai, belum dikerjakan, atau memiliki kendala. Data diperbarui saat rapat dan ketika divisi menyelesaikan pekerjaan.

## 3. Masalah yang ingin diselesaikan

- Tampilan dokumen kurang menarik dan kurang mendukung penyajian data.
- Sulit membedakan serta mencari temuan yang sudah selesai dan belum selesai.
- Sulit memfilter dan merangkum data menurut divisi, pelapor, lokasi, status, dan periode.
- Pengguna ingin melihat antara lain jumlah temuan per divisi, pelapor atau divisi yang aktif melapor, serta jumlah penyelesaian bulanan.
- Progres perlu mudah diperbarui sehingga pembahasan rapat memakai informasi terkini.

Nilai utama yang disarankan: setiap temuan memiliki penanggung jawab dan progres yang jelas sampai penyelesaiannya dapat diperiksa. Tampilan menarik tetap penting untuk pemakaian dan keterbacaan.

## 4. Akun dan tanggung jawab

Pengguna mengusulkan setiap divisi memiliki akun agar dapat memperbarui laporan yang menjadi tanggung jawabnya.

Rekomendasi awal yang belum dikonfirmasi rinciannya: gunakan akun individu yang tergabung dalam divisi, bukan satu kata sandi bersama. Pada MVP, satu operator per divisi bisa cukup. Riwayat perubahan dapat menunjukkan siapa yang memperbarui data.

Peran awal yang diusulkan:

- Admin/pengelola rapat: mengelola data dan membantu pembaruan saat rapat.
- Operator divisi: memperbarui progres temuan yang menjadi tanggung jawab divisinya.
- Verifikator: pihak yang ditunjuk perusahaan untuk memeriksa penyelesaian; tidak otomatis IT Support.
- Pembaca/manajemen: melihat data sesuai akses yang ditentukan.

Peran dapat dirangkap jika sesuai proses perusahaan. Jumlah akun, siapa yang boleh membuat laporan, siapa yang melihat nama pelapor, dan kewenangan mengubah data masih perlu dipastikan.

## 5. Alur status yang diusulkan

`Baru → Diproses → Menunggu verifikasi → Selesai`

- Baru: temuan telah dicatat.
- Diproses: divisi menangani temuan.
- Menunggu verifikasi: divisi menyatakan pekerjaan selesai dan menyertakan bukti.
- Selesai: penyelesaian telah diverifikasi pihak yang berwenang.

Pekerjaan yang terhambat memiliki catatan kendala dan, bila disepakati, target terbaru. Verifikasi gagal atau masalah muncul kembali memerlukan mekanisme pengembalian status yang rinciannya belum diputuskan.

Pemisahan pernyataan selesai dan verifikasi adalah rekomendasi awal, bukan SOP perusahaan yang sudah diketahui. Proses final harus disesuaikan dengan pengelola rapat dan pihak keselamatan terkait.

## 6. Cakupan MVP yang direkomendasikan

### Must-have

- Daftar temuan dengan pencarian, filter, dan pembeda status yang mudah dilihat.
- Form/detail temuan: ID, tanggal laporan, kondisi, lokasi, pelapor, divisi penanggung jawab, PIC individu bila disepakati, prioritas, target penyelesaian, status, progres, dan kendala.
- Foto pendukung dan bukti penyelesaian.
- Akun dan akses berdasarkan peran/divisi.
- Riwayat perubahan: pelaku, waktu, dan perubahan penting.
- Mode rapat yang terbaca di proyektor dan memungkinkan pembaruan hasil pembahasan oleh pengguna yang berwenang.
- Ekspor data dan mekanisme cadangan sederhana.
- Tampilan responsif agar pembaruan dari HP nyaman.

### Should-have

- Ringkasan temuan terbuka, terlambat, menunggu verifikasi, dan selesai pada periode tertentu.
- Filter divisi, lokasi, status, prioritas, pelapor, dan tanggal yang relevan.
- Grafik sederhana yang membantu keputusan setelah pencatatan dan progres berjalan konsisten.

### Tunda

- AI, aplikasi mobile khusus, leaderboard kompetisi, integrasi yang belum dibutuhkan, dan fitur keselamatan perusahaan yang terlalu luas.
- Multi-perusahaan, billing, langganan, dan pemasaran produk eksternal.

Tidak semua kolom harus diwajibkan pada tahap pelaporan awal. Rincian formulir, pemilik prioritas risiko, dan tenggat harus mengikuti alur yang disepakati agar input tidak memberatkan.

## 7. Prinsip dashboard dan data

- Banyak temuan tidak otomatis berarti divisi berkinerja buruk: luas area, jenis pekerjaan, dan keaktifan melapor bisa berbeda.
- Sedikit laporan tidak otomatis berarti lingkungan aman.
- Banyak penyelesaian belum cukup jika temuan berisiko tinggi tetap tertunda.
- Sajikan konteks berupa umur temuan, prioritas, keterlambatan, dan kendala; hindari peringkat menyalahkan berdasarkan angka mentah.
- Bedakan divisi pelapor, lokasi temuan, dan divisi penanggung jawab. Ketiganya dapat berbeda.
- Definisikan hitungan waktu dengan jelas: laporan masuk berdasarkan tanggal laporan, penyelesaian berdasarkan tanggal verifikasi bila alur itu dipakai, serta temuan terbuka sebagai posisi pada waktu tertentu.

## 8. Validasi pemakaian

Rekomendasi awal: uji selama satu bulan atau sekitar tiga rapat dengan ruang lingkup kecil. Ini usulan, bukan jadwal yang sudah disetujui.

Ukur waktu menyiapkan bahan rapat, waktu mencari status, jumlah divisi yang menggunakan, serta persentase temuan aktif dengan progres terbaru. Belum ada baseline atau target angka yang dikonfirmasi.

Portofolio publik memakai data contoh atau materi yang diizinkan perusahaan. Penghargaan finansial, promosi, dan adopsi perusahaan belum dijanjikan.

## 9. Hal yang belum diputuskan

- Nama aplikasi dan identitas visual.
- Stack teknologi, database, penyimpanan foto, hosting/intranet, dan cara login.
- Jumlah pengguna, divisi, lokasi, serta volume data.
- Ketersediaan jaringan dan kebutuhan akses dari luar kantor atau offline.
- Pengelola sistem, operator, verifikator, dan dukungan uji coba.
- Kategori/prioritas risiko dan aturan penetapannya.
- Kebijakan akses, penyimpanan, cadangan, dan penggunaan data nyata.
- Migrasi dari Word, format ekspor yang diperlukan, serta kebutuhan notifikasi.

Jangan mengarang jawaban untuk hal di atas. Tetapkan asumsi yang dapat dibalik untuk prototipe; konfirmasikan keputusan yang memengaruhi akses dan penggunaan nyata.

## 10. Titik lanjut

Permintaan terakhir pengguna adalah membawa konteks ke folder proyek agar tidak perlu menjelaskan ulang di Codex. Belum ada instruksi membangun aplikasi, memilih framework, melakukan deployment, atau menggunakan data perusahaan.

Saat pengguna meminta mulai membangun: baca dokumen ini dan AGENTS.md, periksa isi proyek, lalu mulai dari MVP sesuai arahan pengguna. Hindari mengulang wawancara tentang konteks yang sudah tertulis.

## 11. Pembaruan persiapan dan wawancara — 9 November 2026

Pengguna telah meminta wawancara kebutuhan dan penyusunan kebutuhan MVP, PRD, serta dokumen pendukung. Folder `she-meeting-frontend/` dan `she-meeting-backend/` tersedia dan masih kosong saat pemeriksaan awal. Belum ada keputusan stack atau instruksi deployment. Dokumen kerja tersedia di `docs/README.md`, `docs/PRD.md`, `docs/REQUIREMENTS_INTERVIEW.md`, dan `docs/DECISIONS.md`.

Hasil putaran 1 yang dikonfirmasi pengguna:

- Supervisor biasanya memimpin/moderatori rapat. Operator yang ditunjuk mengoperasikan layar, mencatat, dan memperbarui data. Pengelola rapat dapat berganti.
- Perkiraan sekitar 10 divisi (belum pasti) dan 10–15 temuan baru per bulan. Akun cukup untuk perwakilan divisi; jumlah individu belum diketahui.
- Dalam sebulan ada beberapa rapat; tiap pertemuan biasanya dihadiri 2–3 divisi. Kelompok divisi lain hadir pada hari berbeda.
- Siapa pun dapat melaporkan, termasuk anak magang; laporan boleh masuk kapan saja dan saat rapat. Cara pengiriman oleh pelapor tanpa akun pada aplikasi belum diputuskan.
- Dalam rapat, moderator menanyakan temuan kepada peserta satu per satu. Operator mencatat kondisi, tanggal, nama pelapor, divisi asal, dan divisi penanggung jawab. Operator mengisi divisi penanggung jawab berdasarkan temuan.
- Target penyelesaian tidak langsung ditetapkan saat pencatatan awal.
- Proses saat ini: supervisor/moderator menentukan penyelesaian berdasarkan pernyataan divisi terkait. Belum ada pemeriksaan dan bukti foto. Pengguna menilai tambahan foto/pemeriksaan mungkin bermanfaat, tetapi belum menetapkan kewajibannya.
- Divisi penanggung jawab yang hadir menyampaikan progres. Pekerjaan belum selesai ditandai on progress atau tunda; penundaan disertai alasan pelaksana.
- Calon peserta pilot yang disebut pengguna: Camp, Transport, dan ICT. Persetujuan/kesiapan masing-masing divisi, jadwal, dan ukuran keberhasilan belum dikonfirmasi.

Putaran 2 membahas akun, hak akses, operator bergilir, alur status/persetujuan, kolom dan foto, target/prioritas, koreksi/pembatalan, serta kerahasiaan. Hasilnya dicatat pada bagian 12. Rekomendasi awal pada bagian sebelumnya tetap bukan SOP perusahaan yang disahkan.

## 12. Keputusan terbaru — wawancara putaran 2

Bagian ini menggantikan usulan awal yang bertentangan, khususnya verifikasi dan pembatasan edit berdasarkan divisi.

- Akun cukup untuk perwakilan dan admin pengelola akun. Pelapor tanpa akun menyampaikan lewat perwakilan/operator; tidak ada formulir publik/pengiriman mandiri tanpa login pada MVP.
- Semua pemegang akun dapat melihat dan memperbaiki temuan lintas divisi. Nama pelapor tidak perlu disembunyikan antar divisi. Ini bukan izin akses publik.
- Tampilan rapat dapat difilter untuk beberapa divisi yang hadir. Operator biasanya ditunjuk supervisor/moderator dan menggunakan akses divisinya; tidak perlu akun operator rapat terpisah.
- Supervisor tidak membutuhkan akun khusus. Keputusannya tidak perlu dicatat sebagai persetujuan dalam aplikasi.
- Pengguna memilih alur sederhana dan menolak tahap Menunggu verifikasi/Menunggu persetujuan. Jangan memasukkan kembali alur tersebut ke MVP.
- Baru merupakan label usia tujuh hari pada daftar/detail, bukan status pekerjaan. Status awal pekerjaan masih perlu dipastikan; Diproses, Tertunda dengan alasan, dan Selesai dipakai dalam alur sederhana.
- Masalah yang muncul kembali dibuat sebagai temuan baru, bukan membuka kembali temuan lama.
- Kolom awal yang diusulkan diterima; foto awal/penyelesaian opsional. Penanggung jawab dapat lebih dari satu divisi.
- Target tanggal opsional. Jika kosong, tampilkan Belum ditentukan.
- Prioritas dibutuhkan, mengikuti kesepakatan rapat yang dicatat admin/operator, dan dapat berubah. Skala belum dipastikan.
- Tidak ada hapus permanen di aplikasi; pembatalan beralasan diterima. Perubahan harus punya riwayat yang memperlihatkan pelakunya.

Ambiguitas tersisa: login pribadi terhubung divisi atau login bersama per divisi (berpengaruh pada ketepatan identitas riwayat); status awal pekerjaan; satu status bersama atau status tiap divisi untuk temuan dengan banyak penanggung jawab. Putaran 3 telah diajukan untuk hal ini, kebutuhan teknis/hosting, ekspor/migrasi/notifikasi, desain, dan kesiapan pilot. Detail jawaban terdapat di `docs/REQUIREMENTS_INTERVIEW.md`.


## 13. Keputusan terbaru — wawancara putaran 3 dan paket persiapan

Bagian ini menyelesaikan ambiguitas pada bagian 12 dan menggantikan keterangan awal bahwa teknologi belum dipilih. Jangan menanyakan ulang keputusan yang telah dijawab.

- **Akun bersama per divisi**, tanpa nama pribadi. Alasannya shift 14 hari kerja/7 hari libur; perwakilan/operator dapat berganti. Audit menyebut akun divisi, tidak mengklaim individu.
- **Status awal Diproses**, lalu dapat Tertunda/Selesai. Satu status bersama untuk temuan dengan beberapa divisi. Tidak ada status Belum dikerjakan. Opsi B putaran 3 berarti langsung Diproses, bukan alur approval B yang ditolak pada putaran 2.
- Stack pilihan/kebiasaan pengguna: **JavaScript + Vue.js, Express.js, MongoDB**, versi terbaru. Rancangan memakai stable terbaru kompatibel dan dikunci saat bootstrap, bukan prerelease.
- Sudah ada VPS pribadi Sumopod **2 vCPU, RAM 4 GB, storage 60 GB**, domain melalui Rumahweb, frontend di **Vercel**. Domain aktual, OS, layanan berjalan, kapasitas kosong dan akses belum diperiksa.
- Tahap awal demo/presentasi di VPS pribadi, dengan **data dummy**. Server kantor memerlukan izin; tidak dibuat saat ini. Hosting operasional dipikirkan kembali setelah leader menyetujui. Belum ada izin data nyata.
- Ekspor **PDF saja**. Tidak wajib migrasi Word; temuan masih berjalan dapat diinput ulang manual, disertai temuan baru. **Belum perlu email/WA**.
- Nama sementara **SHE Meeting**, dominan merah/biru. Sidebar kiri, header Home/status login/avatar, **dashboard sebagai halaman awal**. Saat rapat buka daftar dengan detail singkat, filter beberapa divisi, dan angka Diproses/Selesai/Tertunda mengikuti pilihan. Pencatatan cepat ditekankan.
- Target demo pertama **9 November 2026**, bukan janji seluruh MVP selesai hari itu. Pengguna dapat menyediakan sekitar **1–2 jam waktu luang kerja** untuk pengembangan/pemeliharaan.
- Persetujuan leader diminta setelah demo dapat diperlihatkan. Pengguna dari tim **ICT** mengelola akun. Calon pilot Camp, Transport, ICT belum berarti mereka menyetujui adopsi.

Paket persiapan terindeks di `docs/README.md`: PRD, alur, akses, data, API, arsitektur, UI/dashboard, backlog, tes/UAT, deployment/backup, demo/pilot, keputusan dan hasil wawancara. Rancangan seperti validasi field, zona Asia/Jakarta, prioritas tiga tingkat, batas foto, sesi 12 jam, dan backup harian adalah asumsi prototipe (R-01–R-12), bukan aturan perusahaan atau jawaban pengguna.

Wawancara inti cukup untuk memulai demo dummy. Hal yang belum diketahui (akses/domain, perangkat/jaringan/zona perusahaan, backup luar VPS, izin data nyata) dicatat untuk langkah terkait, bukan alasan mengulang wawancara produk. Sampai paket dokumentasi ini ditulis, kedua folder aplikasi masih kosong; belum ada implementasi, tes aplikasi, maupun deployment.


## 14. Pengembangan dimulai — tahap 01 / D0-01

Pengguna meminta mulai coding **bertahap** dan **selalu memperbarui dokumen yang relevan** saat proses develop berubah. Instruksi ini disimpan pada AGENTS.md. Jangan menganggap folder aplikasi masih kosong atau mengulang wawancara persiapan.

Fondasi telah ditulis: Vue/Vite JavaScript, Express, koneksi MongoDB dan konfigurasi lokal; dua package.json/lockfile terpisah; root script menjalankan aplikasi/database/build/tes. Dependency stable diverifikasi dari registry npm saat bootstrap. Runtime lokal yang diuji adalah Node 24.10.0, npm 11.6.0, mongod 8.0.15 yang sudah ada; tidak upgrade global. .nvmrc menargetkan Node 26, engines juga mendukung local major 24.

MongoDB khusus proyek di loopback port 27027 dengan data .local/mongodb, terpisah dari default. GET /health dan /ready internal berjalan; namespace /api/v1 masih ditutup 401 sampai autentikasi dibuat. Tidak ada login palsu. Halaman fondasi merah/biru responsif menampilkan koneksi backend nyata dan fitur belum tersedia; bukan dashboard bisnis.

Validasi: 8 tes backend lulus, build frontend lulus, health/readiness/proxy berhasil, data endpoint 401; browser desktop 1440px dan HP 390px tanpa overflow horizontal, tombol koneksi/drawer dicoba. Lihat docs/DEVELOPMENT_LOG.md dan README untuk cara menjalankan/keterbatasan.

**Tahap berikutnya D0-02:** seed dummy akun Camp/Transport/ICT dan admin, autentikasi sesi, CSRF, dan kontrol akses server. Belum ada akun/seed temuan, CRUD/status bisnis, audit bisnis, foto, PDF atau deployment. Tetap data dummy; penggunaan nyata belum disetujui perusahaan.


## 15. GitHub terpisah dan branch dev/prod

Pengguna meminta mengunggah frontend ke https://github.com/alankurniadi12/she-meeting-2-frontend.git dan backend ke https://github.com/alankurniadi12/she-meeting-2-backend.git, masing-masing dengan branch dev dan prod, sebelum melanjutkan coding. Pemeriksaan awal menunjukkan kedua repo kosong; identitas Git pengguna sudah tersedia.

Folder aplikasi disiapkan sebagai repo mandiri. Dokumen bersama menjadi satu sumber pada backend/docs, sedangkan docs dan PROJECT_CONTEXT.md induk berupa symlink agar jalur kerja lama tetap berlaku. Masing-masing repo memiliki .gitignore/README/.nvmrc/AGENTS; backend juga memiliki script MongoDB lokal mandiri dan workspace/ berisi launcher opsional. Tidak mengunggah dependency/build/secret/database/foto lokal dan tidak menjalankan deployment. Kerja berikutnya pada dev. Detail pemeriksaan sinkronisasi dan promosi ada pada docs/GIT_WORKFLOW.md.


## 16. Hasil sinkronisasi GitHub awal

Push awal berhasil untuk kedua repo, masing-masing dengan dev/prod. git ls-remote mengonfirmasi commit fondasi frontend 8b25cf9 dan backend cadd492 pada kedua branch masing-masing; upstream tersedia, working tree bersih saat verifikasi awal, dan HEAD/default GitHub dev. Hasil sinkronisasi disimpan melalui commit dokumentasi backend lanjutan. Gunakan branch dev untuk kelanjutan D0-02. Tidak ada deployment, konfigurasi CI/CD/branch protection atau perubahan fitur bisnis pada tahap Git ini.


## 17. Pengembangan dilanjutkan — D0-02 / autentikasi

Pengguna meminta melanjutkan coding bertahap dan commit setiap perubahan sesuai branch yang disepakati. D0-02 kini ditulis dan diuji lokal: seed 3 divisi/4 akun dummy (Camp, Transport, ICT, Admin ICT), Argon2id, sesi MongoDB absolut 12 jam, CSRF/Origin, rate limit persisten, serta guard akun aktif/sessionVersion/role di server. Endpoint login/me/logout, baca divisi dan baca akun admin tersedia. Halaman Vue sementara menampilkan login dan identitas akun sebenarnya; belum dashboard.

Kredensial acak hanya `.local/demo-accounts.json` backend, mode 0600/diabaikan Git. Jalankan `npm run seed:demo` dari backend setelah MongoDB lokal aktif; seed ulang tidak mereset akun. Tidak ada temuan dummy yang dibuat pada tahap akun. Validasi: 26 tes backend dengan DB test nyata, build frontend, browser Camp/Admin ICT, refresh, logout, keyboard dan HP 390px. Header Secure diuji, tetapi cross-subdomain HTTPS/hosting belum diuji. Reset/nonaktif/ubah peran melalui endpoint/UI tetap M-06; pemeriksaan revokasi diuji dengan update DB test.

**Berikutnya D0-03:** dashboard pembuka dengan data backend dan kerangka navigasi setelah login, dilanjut daftar/filter serta CRUD pada urutan backlog. Tetap data dummy; tanpa persetujuan data operasional/deployment/promosi prod. Hasil/commit dicatat DEVELOPMENT_LOG.


## 18. Dashboard ringkas — D0-03

Pengguna mengonfirmasi login bisa dipakai, lalu meminta lanjut tahap berikutnya. D0-03 kini ditulis dan diuji lokal: dashboard pembuka setelah login di route /, empat kartu status, indikator terbuka/terlambat, masuk/selesai per bulan, filter beberapa divisi, reset/refresh, query URL, timestamp/zona dan label demo. GET /api/v1/dashboard terproteksi sesi; aggregate MongoDB menghitung temuan unik, mengecualikan batal, membedakan tanggal laporan dan pencatatan selesai.

Seed development loopback kini menambah 18 temuan sintetik insert-only (16 valid/2 batal); sandi dan akun D0-02 tetap. Seed ulang tidak mengubah tanggal, versi, audit atau suntingan temuan. Metadata DEMO_SEED aktor sistem bukan audit bisnis pengguna. `npm run seed:demo` tetap perintah yang sama. Pada seed awal 9 November, scope semua: 16 total, 6 Diproses, 5 Tertunda, 5 Selesai, 11 terbuka, 5 terlambat; angka di UI tetap dihitung backend, bukan hardcode.

Validasi: 37 tes backend lulus dengan database test nyata/terpisah, build frontend, browser Camp/Admin ICT, filter/bulan/refresh/persistensi URL, kosong/galat, keyboard dan HP 390px tanpa overflow. Commit tetap pada dev masing-masing repo dan dokumentasi kanonis backend.

**Selanjutnya D0-04:** daftar rapat, pencarian dan filter multi-divisi dengan ringkasan unik/pagination; lalu D0-05/D0-06 CRUD, progres dan audit bisnis/konflik. Dashboard lengkap (grafik/tren/tindak lanjut) masih M-04. Foto/PDF/admin mutasi, hosting dan izin operasional belum tersedia. Tetap data dummy, tanpa deployment/promosi prod.


## 19. Daftar rapat — D0-04

Pengguna meminta lanjut pengembangan. D0-04 kini ditulis dan diuji lokal: GET /api/v1/findings dan /findings/summary terproteksi sesi, daftar ringkas lintas divisi, pencarian literal, filter multi-divisi/status/prioritas/divisi pelapor/tanggal-basis/pembatalan, urutan stabil dan pagination. List menggabungkan rows dan summary seluruh filter dalam satu facet; temuan bersama tetap sekali, data batal dihitung terpisah dari kartu status. Badge Baru hari 0–6 serta Terlambat dihitung server; target kosong tetap Belum ditentukan.

Frontend Vue Router 4.6.4 stable kompatibel Node 24.10 lokal menambah /login, /dashboard dan /findings (root redirect dengan query). Sidebar dan judul tab mengikuti halaman, filter/page tersimpan di URL dan pulih pada Back/refresh, login ulang mengembalikan tujuan internal yang sah. Desktop enam kolom, HP kartu; state loading/kosong/galat/halaman kosong dibedakan. Dua tes frontend menjaga parameter berulang dan pembatasan redirect login. Tidak mengubah sandi/fixture yang sudah ada.

Validasi: 51 tes backend dengan MongoDB test terpisah, 2 tes frontend dan build lulus. Browser Admin ICT/Camp, 12 hasil Camp+ICT dengan 5 baris per halaman, pencarian panel, data batal, reset/URL/Back/refresh/login ulang, galat, desktop 1440px dan HP 390px diperiksa. Screenshot lokal diabaikan Git; detail/CRUD/progres/PDF tidak diberi tombol fungsi semu.

**Selanjutnya D0-05:** tambah/detail/koreksi, progres/status, prioritas/target opsional, kemudian D0-06 audit bisnis dan konflik versi. Filter baca batal serta badge sudah sebagian M-03/M-01; mutasi/validasi bisnisnya belum. Dashboard grafik/tren/tindak lanjut M-04, admin mutasi/foto/PDF/hosting/izin operasional belum selesai. Tetap data dummy, kerja dev, tanpa deployment/promosi prod.


## 20. Pencatatan dan progres — D0-05

Pengguna meminta lanjut tahap coding. D0-05 kini ditulis dan diuji lokal: POST create, GET detail, PATCH core, POST progress di backend; form /findings/new, detail /findings/:id dan koreksi /edit di Vue. Semua akun login tetap boleh lintas divisi, actor adalah akun divisi dari sesi. Awal Diproses; Tertunda wajib alasan; Selesai tanpa foto/approval, completedAt server; koreksi dari Selesai ke aktif wajib alasan dan bukan untuk kejadian berulang. Prioritas/target opsional, target tidak sebelum laporan.

Fondasi D0-06 didahulukan untuk integritas write pertama: audit before/after + actor/snapshot divisi, progres append-only, receipt acknowledgement dan CAS version ditulis atomik. Retry identik tidak menggandakan; payload/akun berbeda pada ID sama ditolak, ukuran kandidat >8 MiB dihentikan. Respons mutasi acknowledgement immutable lalu GET detail, bukan full detail pada tiap retry. UI menjaga draft saat 409, lihat versi baru atau explicit discard+reload; draft memori tab per akun/resource, tidak tahan refresh/tutup tab. Network/5xx tidak pasti memakai retry payload/ID sama.

Validasi: 62 tes backend dengan DB test terpisah, 5 tes frontend/build lulus. Browser: buat tanpa foto/target, koreksi, tunda dengan alasan, lanjut, Selesai, refresh, konflik dua tab tanpa hilang draft, form/detail HP 390px serta desktop 1440px tanpa overflow. Satu temuan dummy manual D0-05 disimpan di luar 18 fixture (total development 19: 17 valid/2 batal; snapshot saat akhir uji 6 Diproses/5 Tertunda/6 Selesai). Akun/sandi serta fixture seed lama tidak diubah.

**Selanjutnya D0-06:** API/UI riwayat lengkap before/after, progres paginasi dan peninjauan konflik/draft. Detail saat ini hanya 10 progres terakhir, bukan seluruh audit. Batal/pulihkan, foto/PDF/admin mutasi/dashboard lengkap/hosting dan izin operasional belum selesai. Tetap data dummy, commit pada dev, tanpa promosi prod atau deployment.

## 19. D0-06 — riwayat dan peninjauan konflik

D0-06 menambahkan GET histori audit before/after dan progres paginasi, tampilan riwayat pada detail, serta perbandingan semula/draf/terbaru pada konflik koreksi dan progres. Rebase manual mempertahankan field draf yang diubah dan mengambil field server yang tidak diubah; pengguna tetap harus meninjau hasilnya. Aktor akun bersama tetap akun divisi, bukan individu. Event seed lama tidak diberi before/after palsu. Tes integrasi MongoDB dan build frontend lulus; alur browser manual D0-06 dan perangkat kantor belum diuji. D0-07 adalah verifikasi skenario presentasi. Data dummy tetap dipakai; belum deployment atau izin data operasional.

## 20. D0-07 — verifikasi demo lokal

Pengguna meminta langkah berikutnya. Alur demo lokal data dummy diuji di browser: dashboard/list filter dua divisi, create tanpa target/foto, tunda beralasan, selesai, riwayat/progres dua halaman, konflik progres/koreksi dua tab. Bug rebase draf Vue reaktif ditemukan dan diperbaiki; tes regresi ditambah. Koreksi dummy akun ICT melalui API lokal membuktikan audit lintas divisi. Teks UI yang masih menyebut riwayat belum ada diperbarui. Ini verifikasi teknis demo, bukan presentasi leader atau persetujuan pilot. Browser uji tidak berhasil berubah dari 841 px, jadi responsif 390/1440 D0-07 dan perangkat kantor belum diverifikasi. Fitur D1/operasional tetap belum selesai; lanjutkan sesuai prioritas demo/pilot yang diputuskan setelah umpan balik nyata.

## 21. M-03 — pembatalan dan pemulihan demo

Setelah pengguna meninjau demo dan meminta lanjut, pembatalan beralasan serta pemulihan beralasan khusus ADMIN ditambahkan pada backend/frontend lokal. Audit before/after, actor akun divisi, snapshot divisi, versi/retry idempoten dan filter batal tetap konsisten. 64 tes backend MongoDB, 7 tes frontend/build dan alur browser dummy batal/pulih lulus. Kewenangan restore tetap asumsi R-08, bukan keputusan operasional perusahaan. D1 M-02 foto, M-04 dashboard lengkap, M-05 PDF, M-06 admin akun, serta kesiapan pilot belum selesai. Dev saja; prod/deployment tidak disentuh.

## 22. M-02 — foto opsional privat demo

Setelah M-03, pengguna meminta pengembangan diteruskan. M-02 menambah unggah dan lihat foto di detail dengan sesi, Origin/CSRF, validasi decoder/batas, WebP privat, versi/audit/retry dan batas 10. Foto tetap opsional, data batal hanya dapat membaca. 65 tes backend MongoDB, 7 frontend/build lulus; browser lokal memuat foto dummy dan event audit. Folder lokal `.local/uploads` tidak ikut Git. Volume/backup/restore/HTTPS/perangkat kantor/data nyata belum diverifikasi, tanpa deployment atau promosi prod.
