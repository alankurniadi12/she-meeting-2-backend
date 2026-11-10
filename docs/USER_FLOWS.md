# Alur pengguna dan status

Keputusan produk dari putaran 1–3. Detail teknis mengikuti asumsi R-01–R-12 di [catatan keputusan](DECISIONS.md).

## Status implementasi sampai D0-06

Pencatatan/koreksi/progres/status berikut sudah tersedia dengan backend nyata. Audit, guard versi/retry, serta UI/endpoint riwayat lengkap paginasi tersedia melalui D0-06. Batal/pulihkan M-03 dan foto privat M-02 tersedia; PDF dan mutasi admin tetap rencana. Konflik mempertahankan draf, memperlihatkan nilai semula/draf/terbaru, lalu menawarkan rebase manual atau buang draf; tidak otomatis menimpa data versi baru. Retry hasil tidak pasti mempertahankan ID/payload. Draft hanya memori tab, bukan penyimpanan offline/tahan refresh.

## Pencatatan

1. Pelapor menyampaikan kondisi kepada perwakilan/operator, kapan saja atau saat rapat.
2. Operator login dengan akun divisinya. Semua akun divisi boleh mencatat untuk pelapor/divisi lain.
3. Isi tanggal, uraian, lokasi, nama dan divisi asal pelapor, serta satu atau beberapa divisi penanggung jawab. Target, prioritas yang belum dinilai, dan foto dapat kosong sesuai rancangan validasi.
4. Simpan sebagai Diproses. Sistem membuat ID, waktu dan audit pembuat. Baru dihitung dari tanggal laporan, bukan tanggal operator mengetik.
5. Tampilkan temuan di daftar/detail. Tidak diperlukan persetujuan supervisor.

## Rapat dan tindak lanjut

1. Supervisor/moderator menunjuk operator secara lisan; tidak ada modul penunjukan di aplikasi.
2. Operator membuka daftar, memilih beberapa divisi penanggung jawab yang hadir, dan mencari/filter status bila perlu.
3. Daftar dan kartu ringkasan memakai filter yang sama; temuan multi-divisi tidak diduplikasi.
4. Operator membuka detail, mencatat progres, status, alasan tunda, target atau prioritas berdasarkan pembahasan.
5. Simpan satu status bersama. Riwayat menyebut akun divisi yang dipakai. Tidak ada kolom persetujuan/keputusan supervisor.

## Transisi pekerjaan

| Dari | Ke | Ketentuan |
| --- | --- | --- |
| Baru dibuat | Diproses | Default; Baru hanya badge usia |
| Diproses | Tertunda | Alasan wajib |
| Tertunda | Diproses | Boleh setelah pekerjaan dilanjutkan; alasan lama tetap di riwayat |
| Diproses/Tertunda | Selesai | Foto opsional; tidak ada approval |
| Selesai | Diproses/Tertunda | Hanya koreksi salah input dengan alasan, sebagai usulan R-08; kejadian berulang harus dibuat baru |

Memilih Selesai berarti pekerjaan temuan tersebut secara keseluruhan dinyatakan selesai, termasuk semua divisi penanggung jawab. Usulan R-03 ini perlu dijelaskan di UI; bukan indikator pemeriksaan fisik.

Progres ditambahkan sebagai catatan bertanggal, bukan persentase per divisi. Tidak ada status Belum dikerjakan atau Menunggu verifikasi.

## Pembatalan dan koreksi

- Semua akun divisi dapat mengoreksi isi lintas divisi.
- Prototipe M-03: semua akun login boleh membatalkan dengan alasan wajib; penanda batal terpisah dari status pekerjaan. Simpan memakai versi dan mutationId; konflik mempertahankan alasan draf untuk ditinjau.
- Data batal tersembunyi dari daftar/ringkasan biasa, tetapi dapat dibuka melalui filter Batal.
- Tidak tersedia hapus permanen. Hanya admin dapat memulihkan dengan alasan wajib; status/progres lama tetap. Kewenangan ini masih asumsi R-08, bukan SOP yang disahkan.
- Audit sebelum/sesudah tetap tersedia, termasuk setelah perubahan nama divisi/penugasan.
- Bila dua akun mengubah versi yang sama, simpan pertama berhasil; simpan kedua mendapat konflik, menjaga drafnya, lalu memuat perubahan terbaru sebelum mencoba lagi.

## Keluar dan pergantian shift

Pengguna keluar dari sesi perangkatnya. Pengguna shift lain masuk memakai akun divisi yang sama; beberapa sesi perangkat diperbolehkan. ICT dapat mereset sandi atau menonaktifkan akun dan mencabut sesi. Aplikasi tidak meminta nama orang yang sedang mengoperasikan akun.

## Foto opsional M-02

Setelah temuan tercatat, buka detail, pilih jenis dan satu foto. Backend memeriksa sesi, Origin/CSRF, isi gambar, ukuran, batas 10, versi dan status batal. Jika unggah gagal, teks temuan/progres yang sudah tersimpan tetap ada; pilih ulang file atau retry hasil tak pasti di tab yang sama. Foto yang berhasil tampil di galeri dan dapat dibuka akun login, termasuk bila temuan kemudian dibatalkan. Tidak ada hapus foto pada MVP.

## Admin ICT mengelola akun divisi — M-06 sebagian

Admin masuk lalu membuka Kelola akun. Ia dapat membuat akun DIVISION pada master divisi aktif, menyalin sandi sementara yang tampil sekali, mereset sandi, atau menonaktifkan/mengaktifkan akun divisi. Reset/nonaktif segera mengakhiri sesi akun target. Akun divisi tidak melihat menu dan server menolak endpoint admin. Menambah admin lain atau mengubah master divisi masih belum tersedia.
