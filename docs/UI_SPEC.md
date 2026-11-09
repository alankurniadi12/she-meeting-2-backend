# Spesifikasi UI dan statistik

Nama sementara pilihan pengguna: **SHE Meeting**. Warna dominan merah dan biru. Dashboard halaman pembuka; sidebar kiri dan header berisi Home, status login/nama akun, avatar dan keluar. Referensi logo, kode warna resmi, perangkat kantor dan resolusi proyektor belum diberikan; gunakan placeholder tanpa mengarang identitas perusahaan.

## Implementasi saat ini — tahap 04

Vue Router kini menyediakan /login, /dashboard dan /findings; / mengarah ke dashboard dengan query lama. Setelah login, tujuan default dashboard, atau kembali ke tautan daftar/dashboard internal yang diminta sebelum login. Header/sidebar aktif sesuai halaman, judul tab ikut berubah, nama/peran/avatar/Keluar tetap nyata. Route lain belum tersedia; peta berikut mengandung target tahap selanjutnya.

Daftar D0-04: checkbox beberapa divisi, pencarian kondisi/lokasi/pelapor/referensi, status, filter lanjutan yang dapat dilipat (prioritas, divisi pelapor, dasar/rentang tanggal, pembatalan, urutan dan baris 5/10/20/50/100). Terapkan filter mulai halaman 1; Reset menghapus pilihan termasuk draf belum diterapkan. Ringkasan empat kartu menghitung seluruh hasil filter sebelum pagination. Data batal terpisah dan tidak masuk kartu status. Enam kolom desktop: temuan/lokasi, pelapor, penanggung jawab, prioritas/target, status/badge, pembaruan; HP menjadi kartu dengan label. Target kosong Belum ditentukan, prioritas kosong Belum dinilai; Baru dan Terlambat mengikuti perhitungan server. Aktor DEMO_SEED ditulis Seed data demo, bukan individu.

URL menyimpan filter/page. Back/Forward/refresh mengembalikan pilihan; Perbarui data membaca ulang. Loading/galat menyembunyikan kartu/baris lama, galat memberi Coba lagi/Reset, kosong sah memberi nol, page di luar hasil menyediakan Ke halaman pertama. Belum tombol tambah/detail/koreksi/progres/PDF; catatan tahap berikutnya menyatakan batasnya.

Dashboard ringkas D0-03 tetap tersedia: empat kartu, indikator terbuka/terlambat/bulanan, filter divisi/bulan, timestamp dan label demo. Grafik per-divisi/tren/5 tindak lanjut masih M-04. Semua angka backend; sesi/token tidak disimpan di localStorage. Tujuan setelah login dibatasi ke route internal yang diimplementasikan, bukan URL bebas.

Browser D0-04: Admin ICT/Camp, filter Camp+ICT menghasilkan 12 unik dalam tiga halaman ukuran 5, pindah halaman tidak mengubah angka, pencarian panel menghasilkan 3, URL/Back/refresh, data batal, kosong/galat dan reset diuji. Desktop 1440px seluruh enam kolom terlihat; HP 390px tidak overflow horizontal, drawer/navigasi kembali dicoba. Hosting/proyektor/perangkat kantor belum diuji.

## Peta halaman

| Route | Halaman | Isi |
| --- | --- | --- |
| /login | Login | Username divisi, sandi, galat jelas |
| /dashboard | Dashboard/Home | Ringkasan, grafik sederhana, temuan perlu tindak lanjut |
| /findings | Daftar temuan/rapat | Filter, ringkasan sesuai filter, tabel, tambah temuan, ekspor PDF |
| /findings/new | Catat temuan | Kolom awal, foto opsional |
| /findings/:id | Detail | Kondisi, pelapor, penugasan, target/prioritas, progres, foto, riwayat |
| /findings/:id/edit | Koreksi | Edit lintas divisi dan alasan koreksi bila perlu |
| /admin/accounts | Akun | Buat/reset/nonaktifkan; admin saja |
| /admin/divisions | Master divisi | Tambah/ubah/nonaktifkan; admin saja |

Tidak menambahkan menu persetujuan, pengguna pribadi, jadwal rapat, billing, atau halaman tanpa fungsi.

## Layout dan gaya

- Desktop: sidebar tetap, header ringkas, konten cukup lebar untuk proyektor. HP: sidebar drawer, filter dapat dilipat, form satu kolom.
- Rancangan warna awal: biru #1D4ED8 untuk navigasi/aksi, merah #DC2626 sebagai aksen merek. Status memakai teks+ikon/warna: biru Diproses, amber Tertunda, hijau Selesai; jangan mengandalkan warna saja.
- Avatar akun divisi berupa inisial/ikon, admin avatar bawaan. Tidak meminta foto orang yang memakai akun bersama. Unggah avatar khusus ditunda.
- Bahasa Indonesia, format tanggal terbaca, badge Baru dan Terlambat terpisah dari status.
- Label data demo tampil pada seluruh halaman. Loading, kosong, tidak ditemukan, gagal, sesi berakhir, konflik, dan sukses harus berbeda dan memberi tindakan yang jelas.

## Dashboard

Dashboard lengkap dalam batas MVP: empat kartu utama (Total valid, Diproses, Tertunda, Selesai), indikator pekerjaan terbuka dan terlambat, grafik status per divisi, tren laporan masuk/selesai enam bulan, dan daftar tindak lanjut (tertunda/terlambat) beserta update terakhir. Tidak perlu banyak grafik yang mengulang angka.

Filter bersama dashboard: beberapa divisi penanggung jawab. Default semua divisi. Dashboard snapshot tidak diberi filter tanggal secara default; bulan terpilih hanya untuk dua angka periodik dan tren. Tampilkan periode dan cakupan di dekat angka.

- Kartu status menghitung posisi terkini semua temuan aktif sesuai divisi terpilih, bukan hanya laporan bulan ini.
- Dua angka periodik: Laporan masuk [bulan] berdasarkan reportedDate; Dicatat selesai [bulan] berdasarkan completedAt dan status terkini COMPLETED.
- Grafik per divisi menghitung kontribusi divisi. Temuan bersama dua divisi masuk pada kedua batang divisi; total kartu tetap unik. Tulis keterangan bahwa jumlah batang dapat melebihi total temuan.
- Tren per bulan memakai tanggal masuk dan tanggal pencatatan selesai masing-masing, pada scope divisi yang sama. Koreksi status dapat mengubah statistik; tidak mengklaim snapshot historis resmi.
- Tabel tindak lanjut menampilkan paling banyak lima item awal, dengan tautan ke daftar terfilter dan urutan terlambat/tertunda terlama. Tidak membuat leaderboard menyalahkan divisi.

## Daftar rapat

Urutan komponen: judul dan Tambah temuan/PDF → filter multi-divisi → kartu status sesuai filter → pencarian/filter lanjutan → daftar → pagination dan waktu data terakhir dimuat.

Kolom desktop: referensi/tanggal, uraian singkat/lokasi, pelapor/divisi asal, divisi penanggung jawab, prioritas/target, status/badge, update terakhir, Buka detail. HP memakai kartu yang memuat inti yang sama. Detail foto tidak harus ditampilkan dalam setiap baris.

Filter: divisi penanggung jawab (multi), status, prioritas, divisi pelapor, tanggal laporan atau tanggal selesai, pencarian referensi/kondisi/lokasi/nama pelapor, dan data batal. Tombol Reset menghapus filter. Simpan filter ke URL untuk navigasi balik; bukan menyimpan data rahasia di URL.

Logika divisi: cocok salah satu divisi penanggung jawab yang dipilih. Duplikasi hasil dan hitungan dilarang. Bedakan label filter Divisi penanggung jawab dan Divisi pelapor. Angka ringkasan dihitung seluruh hasil filter sebelum pagination.

Usulan default urutan tanggal laporan terbaru dan ID sebagai tie-breaker. Refresh manual setelah perubahan serta saat kembali ke halaman; polling/sinkronisasi real-time ditunda. Beri cap waktu agar data tidak tampak selalu live.

## Form, detail, dan progres

- Kelompok awal: tanggal, kondisi, lokasi, nama/divisi pelapor, multi-penanggung jawab. Target opsional; prioritas opsional dengan Belum dinilai; foto opsional.
- Default status Diproses; tidak ada pilihan Baru sebagai status.
- Detail membedakan pelapor, akun pencatat, dan akun pengubah terakhir.
- Aksi progres: catatan, status, target/prioritas; alasan wajib bila Tertunda. Selesai tidak memerlukan foto/approval.
- Konfirmasi singkat saat menyelesaikan: status berlaku untuk semua pekerjaan/divisi pada temuan ini.
- Riwayat: waktu, akun divisi, tindakan, nilai sebelum/sesudah; hindari menampilkan raw JSON kepada pengguna.
- Pembatalan: alasan wajib dan peringatan dampak ke daftar/angka. Tidak ada Hapus permanen.
- Jangan menghilangkan isian saat gagal simpan/konflik. Jangan menampilkan sukses sebelum server mengonfirmasi.

## Rumus (asumsi prototipe)

| Istilah | Definisi |
| --- | --- |
| Data valid/aktif | cancelledAt=null; kata aktif di sini berarti tidak dibatalkan, berbeda dari status belum selesai |
| Total | Banyaknya finding unik yang lolos scope/filter |
| Diproses/Tertunda/Selesai | Jumlah status IN_PROGRESS/ON_HOLD/COMPLETED pada finding valid |
| Terbuka | Diproses + Tertunda, bukan status tambahan |
| Baru | 0 ≤ selisih hari kalender hari ini dengan reportedDate < 7 di Asia/Jakarta; hari laporan = hari 0 |
| Terlambat | Target terisi dan targetDate < hari ini, status belum COMPLETED, tidak batal; target hari ini belum terlambat |
| Umur | Selisih hari kalender dengan reportedDate; bukan tanggal pembuatan record |
| Masuk bulan X | reportedDate berada dalam bulan X |
| Dicatat selesai bulan X | Status kini COMPLETED dan completedAt berada dalam bulan X; bukan verifikasi |
| Selesai kosong | completedAt=null kecuali status COMPLETED |

Data batal tidak masuk dashboard biasa. Pada filter Batal/Semua di daftar, tampilkan jumlah batal secara terpisah; kartu progres/selesai/tertunda tetap hanya data tidak batal. PDF mencantumkan aturan ini. Parameter tanggal valid dan kedua ujung inklusif; backend mengubah batas waktu sesuai zona aplikasi.

## PDF

Judul SHE Meeting — Data Demo pada demo, tanggal cetak/zona, akun divisi pembuat, filter, basis tanggal, jumlah temuan dan ringkasan. Kolom minimum: referensi/tanggal, uraian/lokasi, pelapor/divisi, penanggung jawab, status, prioritas, target, progres/alasan terakhir. Teks panjang dibungkus, header diulang, nomor halaman tersedia. Foto dan seluruh audit tidak ditanam dalam PDF MVP. PDF berisi semua hasil filter, bukan hanya halaman tabel saat ini.
