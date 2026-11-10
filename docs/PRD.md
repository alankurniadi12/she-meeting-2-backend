# PRD — SHE Meeting

Versi 0.3 · 9 November 2026 · hasil wawancara putaran 1–3.

Status implementasi: D0-01/fondasi, D0-02/autentikasi, D0-03/dashboard ringkas, D0-04/daftar rapat dan D0-05/pencatatan-progres selesai serta diuji lokal. FR-07 baru sebagian (kartu/indikator/filter); grafik/tren/daftar tindak lanjut masih M-04. D0-04/FR-06 daftar rapat, pencarian/filter dan pagination sudah diuji. D0-05 menambah create/detail/koreksi/progres dengan validasi status/target dan jejak audit atomik serta guard versi/retry. D0-06 menambah API/tampilan riwayat before/after dan progres dipaginasi serta peninjauan konflik/draf manual. M-02 menambah foto opsional privat pada detail dengan validasi dan akses bersesi yang diuji lokal. M-03 menambah pembatalan beralasan, pemulihan ADMIN beralasan, dan audit/filter batal yang diuji lokal. D0-07 menguji alur sebelumnya di browser lokal dan memperbaiki rebase proxy Vue; uji layar HP/proyektor dan presentasi leader belum dilakukan. Lihat [catatan pengembangan](DEVELOPMENT_LOG.md). Kebutuhan produk cukup untuk melanjutkan demo dummy. Rincian teknis menggunakan asumsi prototipe pada [catatan keputusan](DECISIONS.md). Belum disetujui perusahaan untuk data operasional.

## 1. Masalah dan tujuan

Temuan kondisi tidak aman saat ini dicatat di Word dan ditampilkan lewat proyektor. Pencarian, pemisahan status, rangkuman lintas divisi, dan pembaruan progres sulit dilakukan. SHE Meeting menjadi aplikasi web internal satu perusahaan untuk mencatat, mencari, menampilkan, dan menindaklanjuti temuan sebelum maupun saat rapat.

Keberhasilan awal: operator cepat mencatat; peserta mudah menemukan temuan dan melihat status/progres yang relevan. Dashboard mendukung ringkasan manajemen. Proyek juga merupakan kontribusi IT Support dan portofolio; monetisasi bukan tujuan.

## 2. Pengguna dan konteks

- Sekitar 10 divisi (perkiraan), 10–15 temuan baru per bulan.
- Satu akun bersama per divisi karena perwakilan berganti mengikuti shift 14 hari kerja dan 7 hari libur. Bukan login pribadi.
- Siapa pun, termasuk anak magang, dapat menjadi pelapor. Pencatatan dilakukan pengguna akun; tanpa formulir publik.
- Supervisor/moderator memimpin rapat dan biasanya menunjuk operator dari salah satu divisi. Tidak ada akun atau persetujuan supervisor khusus.
- Beberapa rapat per bulan, biasanya 2–3 divisi per rapat; kelompok lain hadir pada hari berbeda.
- Admin/pengelola akun adalah pengguna dari tim ICT. Akun admin administratif disarankan terpisah dari akun bersama ICT untuk membatasi akses pengelolaan akun.
- Calon pilot: Camp, Transport, ICT. Leader baru dimintai persetujuan setelah demo dapat diperlihatkan.

## 3. Keputusan alur inti

- Status awal **Diproses**, dengan satu status bersama per temuan walaupun penanggung jawabnya beberapa divisi.
- Status pekerjaan hanya **Diproses, Tertunda, Selesai**. Tertunda membutuhkan alasan.
- **Baru** adalah label usia tujuh hari di daftar/detail, bukan status.
- Tidak ada tahap menunggu verifikasi/persetujuan, kewajiban bukti foto, atau pencatatan keputusan supervisor.
- Masalah yang muncul kembali dibuat sebagai temuan baru. Koreksi salah input tetap boleh dilakukan dan dicatat dalam riwayat.
- Semua pengguna akun dapat melihat dan memperbaiki semua temuan lintas divisi.
- Riwayat menyebut akun divisi pengubah. Tidak mengklaim mengetahui orang yang menggunakan akun bersama.
- Salah input/duplikat dapat dibatalkan dengan alasan; tidak tersedia hapus permanen.

## 4. Kebutuhan dan penerimaan

| ID | Kebutuhan | Kriteria penerimaan utama |
| --- | --- | --- |
| FR-01 | Login akun divisi dan admin | Tanpa login tidak bisa mengakses data/API; nama akun/divisi tampil setelah login; admin mengelola akun |
| FR-02 | Catat dan koreksi temuan | Simpan tanggal, kondisi, lokasi, nama/divisi pelapor, satu atau lebih divisi penanggung jawab; pelapor berbeda dari pencatat; pengguna login boleh koreksi lintas divisi |
| FR-03 | Progres dan status | Awal Diproses; pindah Tertunda wajib alasan; Selesai tanpa persetujuan/foto wajib; satu status untuk semua penanggung jawab |
| FR-04 | Target dan prioritas | Target kosong sah dan tampil Belum ditentukan; prioritas dapat diubah dan tercatat riwayat; keputusan nilai prioritas berasal dari pembahasan rapat |
| FR-05 | Foto opsional | Pencatatan dan penyelesaian tetap bisa disimpan tanpa foto; unggahan valid dapat dilihat pengguna login |
| FR-06 | Daftar rapat | Pencarian dan filter beberapa divisi sekaligus; uraian singkat/status/penanggung jawab terlihat; temuan tidak berganda jika beberapa divisi cocok; angka mengikuti filter |
| FR-07 | Dashboard pembuka | Ringkasan Diproses/Tertunda/Selesai, pekerjaan terbuka/terlambat, tren sederhana, serta daftar tindak lanjut dengan rumus jelas |
| FR-08 | Riwayat dan pembatalan | Akun divisi, waktu, perubahan sebelum/sesudah tercatat; batal wajib alasan; tidak ada hapus permanen |
| FR-09 | Ekspor PDF | Unduh laporan terbaca yang mengikuti filter, mencantumkan waktu pembuatan dan definisi periode; bukan hanya halaman pagination yang sedang terlihat |
| FR-10 | UI dan akses perangkat | Nama SHE Meeting, merah/biru, sidebar kiri, header akun/Home/avatar, dashboard sebagai halaman awal; dapat digunakan pada PC dan HP sebagai asumsi desain awal |
| FR-11 | Administrasi dan operasi | Admin ICT membuat/reset/nonaktifkan akun, mengelola master divisi; backup mencakup database dan foto serta diuji pulih sebelum data nyata |
| FR-12 | Pembaruan bersamaan | Perubahan versi lama ditolak sebagai konflik; isian tidak hilang; perubahan dan audit tersimpan bersama |

Rincian field pada [model data](DATA_MODEL.md); layar/angka pada [UI](UI_SPEC.md); akses pada [matriks akses](ACCESS_CONTROL.md).

## 5. Cakupan dan penundaan

**Masuk MVP:** kebutuhan FR-01–FR-12, input manual temuan baru/masih berjalan, PDF, dashboard dan daftar rapat.

**Demo pertama:** irisan D0 pada [backlog](BACKLOG.md), bukan seluruh MVP. Setiap fitur yang belum berfungsi harus terlihat sebagai belum tersedia, bukan tombol yang memberi kesan berhasil.

**Ditunda/dikeluarkan:** import Word otomatis, Excel, notifikasi email/WhatsApp, formulir publik, akun individu, verifikator, approval, status per divisi, pembukaan kembali kejadian lama, absensi/jadwal/notulen rapat, AI, offline/sinkronisasi, aplikasi mobile khusus, multi-perusahaan dan billing. Foto profil unggahan khusus juga ditunda; avatar bawaan cukup untuk demo.

## 6. Teknologi dan lingkungan

Pilihan pengguna: JavaScript, Vue.js, Express.js, MongoDB; versi stable terbaru yang kompatibel dikunci saat bootstrap. Frontend Vercel; backend/database demo di VPS pribadi Sumopod 2 vCPU, RAM 4 GB, storage 60 GB; domain melalui Rumahweb. Tidak perlu server lokal kantor untuk demo.

Seluruh demo memakai data dummy. Izin penyimpanan data perusahaan, tujuan hosting setelah persetujuan, spesifikasi OS dan kapasitas kosong VPS belum diketahui. Konfigurasi dan akses VPS/domain belum diperiksa.

## 7. Ukuran keberhasilan

Pengguna menekankan pencatatan cepat dan daftar rapat dengan angka yang mengikuti divisi terpilih; dashboard lengkap dalam batas MVP juga diminta. Tiga prioritas formal/baseline belum dipilih secara eksplisit. Usulan uji: catat satu temuan tanpa bantuan, temukan satu temuan dengan filter, ubah progres dan pastikan akun divisinya tercatat. Ukur waktunya saat demo/pilot, jangan mengarang target perusahaan.

## 8. Batas klaim dan risiko

Selesai berarti status yang dicatat pengguna, bukan bukti inspeksi independen. Semua divisi boleh edit; risiko salah ubah ditangani audit, validasi, dan konflik versi. Akun bersama tidak dapat mengidentifikasi individu. VPS pribadi merupakan lingkungan demo dengan satu titik kegagalan; kapasitas cukup belum terbukti. Persetujuan leader, jaringan/perangkat nyata, backup dan pemulihan harus diperiksa sebelum penggunaan operasional.
