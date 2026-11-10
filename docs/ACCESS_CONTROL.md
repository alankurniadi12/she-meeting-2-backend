# Matriks hak akses dan akun

## Keputusan pengguna

Akun **bersama per divisi**, tanpa nama pribadi, mendukung pergantian shift 14/7. Semua pemegang akun divisi melihat dan memperbaiki temuan lintas divisi, termasuk nama pelapor. Operator rapat tidak memerlukan peran/login baru. Tidak ada akun khusus supervisor atau verifikator.

Admin ICT mengelola akun. Rancangan teknis: satu akun admin operasional terpisah dari akun bersama ICT. Nama tampilan admin cukup Admin ICT; tidak mewajibkan nama pribadi.

## Status implementasi sampai M-03

Login/logout, identitas me, baca divisi, baca akun admin, dashboard agregat serta daftar/ringkasan temuan sudah diuji pada server. List/summary juga diuji menolak sesi yang sudah dicabut; pembaca Camp boleh membaca lintas divisi. Dashboard memakai filter penanggung jawab yang dipilih, bukan batas divisi akun; semua akun login boleh melihat seluruh scope. Seluruh namespace data memerlukan sesi; namespace admin memeriksa role terkini. D0-05 mengimplementasikan tambah/detail/koreksi/progres temuan lintas divisi setelah sesi/CSRF/Origin. Actor/waktu tidak diterima dari payload; audit/receipt/versi ditulis atomik. Batal beralasan tersedia untuk akun login, restore beralasan hanya ADMIN dengan pemeriksaan server; endpoint kelola akun divisi dan master divisi tersedia pada M-06; PDF masih rencana. Foto M-02 ditulis/dibaca hanya setelah sesi; unggah memerlukan Origin/CSRF dan data batal menolak unggah. Pembacaan audit lengkap tersedia. Revokasi status/sessionVersion diuji melalui perubahan database test; belum ada UI/endpoint reset. Audit bisnis inti sudah disimpan pada D0-05; UI/endpoint riwayat lengkap dan audit administrasi masih tahap berikutnya.

## Matriks

| Tindakan | Tanpa login | Akun divisi | Admin ICT | Status |
| --- | --- | --- | --- | --- |
| Login | Ya | Ya | Ya | Produk |
| Melihat daftar, detail, dashboard, nama pelapor | Tidak | Ya, semua divisi | Ya | Produk |
| Mencatat/koreksi laporan dan penanggung jawab | Tidak | Ya, semua divisi | Ya | Produk |
| Mengubah progres/status/target/prioritas | Tidak | Ya, semua divisi | Ya | Produk |
| Unggah/lihat foto | Tidak | Ya | Ya | Produk; batas berkas teknis |
| Melihat audit | Tidak | Ya | Ya | Produk |
| Unduh PDF sesuai filter | Tidak | Ya | Ya | Asumsi R-09 |
| Batalkan dengan alasan | Tidak | Ya | Ya | Mekanisme produk; pelaku asumsi R-08 |
| Pulihkan pembatalan dengan alasan | Tidak | Tidak | Ya | Asumsi R-08 |
| Hapus permanen temuan/audit | Tidak | Tidak | Tidak | Produk |
| Buat/reset/nonaktifkan akun | Tidak | Tidak | Ya | Admin dipilih pengguna |
| Kelola/nonaktifkan master divisi | Tidak | Tidak | Ya | Asumsi teknis |
| Backup/pemulihan server | Tidak | Tidak | Di luar UI oleh ICT | Operasi |

Akun tidak dapat menaikkan peran, mengganti divisinya sendiri, atau menentukan aktor/waktu audit melalui payload. Backend memeriksa sesi, status akun dan peran untuk setiap endpoint. CORS dan filter UI bukan otorisasi.

## Riwayat akun bersama

Simpan accountId, username dan nama divisi pada saat tindakan, waktu server, jenis tindakan, dan perubahan. Teks UI: Diubah oleh akun Camp, bukan Diubah oleh individu tertentu. Pelapor tidak otomatis sama dengan pencatat. Tidak meminta nama operator untuk mengakali keputusan akun bersama.

Reset sandi/penonaktifan mencabut seluruh sesi akun terkait. Logout hanya sesi saat ini. Sesi beberapa perangkat diperbolehkan; jangan simpan kredensial atau token di log.

Rancangan kredensial: admin membuat sandi acak minimal 12 karakter dan menyampaikannya melalui kanal internal yang disepakati pengguna; tidak dikirim oleh agen atau disimpan di source/PDF. Akun bersama memakai kredensial yang sama antar shift, bukan kewajiban membuat identitas pribadi. Reset dilakukan ICT bila akses perlu diganti. Audit reset hanya mencatat jenis tindakan dan akun admin pelaku, tanpa sandi/hash sebelum maupun sesudah.

Admin tidak mewakili kewenangan penilaian keselamatan. Tidak ada permission approval tersembunyi.

## M-06 sebagian — pembeda admin ICT

`admin.ict` role ADMIN dapat membuka `/admin/accounts`, membuat akun DIVISION, reset sandi, nonaktif/aktif akun divisi dan memulihkan temuan batal. Akun Camp/Transport/ICT role DIVISION tetap dapat mencatat/membaca temuan lintas divisi tetapi `/admin/*` ditolak 403 di server. Akun admin sendiri tidak dapat diubah melalui UI/API tahap ini; penambahan admin perlu keputusan terpisah. `/admin/divisions` hanya untuk ADMIN dan server menolak akun DIVISION. Nonaktif master ditolak saat akun divisi masih aktif. Reset/nonaktif mencabut seluruh sesi akun target. Sandi baru hanya tampil sementara di tab admin setelah berhasil disimpan, tidak dikirim sebagai respons API.
