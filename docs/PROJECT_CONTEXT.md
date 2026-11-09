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
