# Spesifikasi UI dan statistik

Nama sementara pilihan pengguna: **SHE Meeting**. Warna dominan merah dan biru. Dashboard halaman pembuka; sidebar kiri dan header berisi Home, status login/nama akun, avatar dan keluar. Referensi logo, kode warna resmi, perangkat kantor dan resolusi proyektor belum diberikan; gunakan placeholder tanpa mengarang identitas perusahaan.

## Implementasi saat ini — tahap 05

Route /login, /dashboard, /findings, /findings/new, /findings/:id dan /findings/:id/edit tersedia; root tetap redirect dashboard. Sidebar/judul tab mengikuti halaman, filter daftar tersimpan pada returnTo yang dibatasi ke route daftar internal. Tujuan login kini juga mengizinkan form/detail/koreksi internal dengan ID valid, tanpa redirect eksternal. Detail membedakan pelapor, divisi asal, penanggung jawab bersama, akun pencatat/pengubah dan waktu server.

Form tambah: tanggal default server, uraian/lokasi/nama-divisi pelapor/penanggung jawab wajib, prioritas Belum dinilai dan target Belum ditentukan bila kosong. Awal Diproses, tanpa foto wajib. Koreksi informasi dasar terpisah dari form progres/status pada detail. Tertunda wajib alasan; keluar Tertunda menghapus alasan aktif tetapi tetap tersimpan audit. Memilih Selesai meminta checkbox pemahaman bahwa status berlaku untuk semua divisi, bukan persetujuan supervisor; foto tetap opsional. Koreksi Selesai ke aktif meminta alasan dan menjelaskan kejadian berulang harus temuan baru.

Catatan progres append-only, detail menampilkan maksimal 10 terbaru/total dan actor akun; D0-06 menampilkan semua catatan dan audit before/after per 10 item dengan navigasi halaman. Temuan batal read-only. Simpan sukses berdasarkan acknowledgement server, dilanjut GET detail terbaru; pesan sukses berasal dari notice memori akun/temuan setelah acknowledgement, bukan parameter URL. Error field diberi label manusia, tanpa raw JSON/field internal.

Draf form/progres disimpan di memori tab per akun/resource, bertahan remount selama tab masih hidup. Tidak ke localStorage dan tidak tahan refresh/tutup tab; ada peringatan. Navigasi dicegah saat menyimpan. Bila respons tidak pasti, field dikunci dan retry memakai payload/ID sama. Konflik menjaga draf dan menghentikan simpan; perbandingan versi terbaru serta tindakan rebase atau buang draf tersedia. Draft yang tidak diubah boleh mengikuti data terbaru. D0-06 membandingkan nilai semula/draf/terbaru dan menawarkan rebase manual: field draf yang diubah dipertahankan, field yang belum diubah mengikuti server. Ini bukan merge otomatis untuk perubahan serentak pada field yang sama; pengguna meninjau sebelum simpan. Pemulihan sesi penuh belum tersedia.

Browser D0-05: satu temuan dummy tanpa foto/target dibuat, dikoreksi, ditunda dengan alasan, dilanjutkan, lalu Selesai dan bertahan refresh. Dua tab: write kedua konflik, teks draft tetap terlihat; pemuatan ulang eksplisit setelah discard berfungsi. Koreksi Selesai tanpa alasan ditolak form. Daftar q=D0-05 menunjukkan satu hasil Selesai; desktop 1440px dan HP 390px detail/form tidak overflow. Tidak mengubah 18 fixture/sandi awal. Dashboard/daftar D0-03/D0-04 tetap tersedia; foto/PDF/dashboard lengkap/admin mutasi belum.

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

D0-07: alur riwayat/progres lebih dari 10 item dan konflik koreksi/progres diuji di browser lokal. Rebase proxy Vue diperbaiki setelah kegagalan nyata, lalu simpan draf berhasil. Teks UI yang menyebut riwayat belum tersedia dihapus. Browser uji tidak berhasil memakai viewport 390/1440; verifikasi responsif tahap ini tetap terbuka.
