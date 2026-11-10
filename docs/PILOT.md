# Rencana demo, pilot, dan risiko

Target demo pertama: **9 November 2026**. Pengguna mengembangkan/merawat sekitar 1–2 jam pada waktu luang kerja. Leader baru dimintai persetujuan setelah demo bisa ditampilkan. Belum ada persetujuan pilot perusahaan.

## Demo pertama

Tujuan: memperlihatkan bahwa alur rapat yang sekarang dapat dilakukan lebih mudah. Pakai data dummy, bukan menyalin Word operasional tanpa izin. Demo lokal boleh didahulukan; deploy demo pribadi setelah konfigurasi tersedia dan jalur utama berjalan.

Skenario sekitar 10–15 menit (usulan, dapat disesuaikan):

1. Login akun divisi Camp, jelaskan akun bersama karena shift dan batas auditnya.
2. Buka dashboard SHE Meeting merah/biru: angka status, snapshot, dan beda tanggal laporan versus selesai.
3. Buka daftar rapat; pilih Camp dan Transport. Tunjukkan angka mengikuti filter dan temuan bersama muncul sekali.
4. Catat kondisi anonim untuk dua divisi; target/foto kosong; status otomatis Diproses dan label Baru.
5. Tambah progres, pilih Tertunda; alasan wajib. Lanjutkan ke Selesai tanpa approval.
6. Tunjukkan riwayat Diubah oleh akun Camp, bukan nama orang. Koreksi dari akun ICT untuk membuktikan edit lintas divisi bila sudah tersedia.
7. Tunjukkan foto opsional, batal/PDF hanya jika fiturnya sudah bekerja. Nyatakan fitur D1 yang belum tersedia dengan jelas.
8. Minta tanggapan leader atas alur, keterbacaan, dan kesiapan pilot; tidak menjanjikan keamanan/produksi atau memaksa migrasi Word.

Tidak mengklaim demo telah diadakan hanya karena skenario ini ditulis.

## Pilot setelah persetujuan

Calon divisi: Camp, Transport, ICT. Usulan durasi satu bulan atau sekitar tiga rapat dari konteks awal belum disetujui. Tentukan jadwal bersama leader sesudah demo. Mulai dari temuan baru dan temuan masih berjalan yang boleh dimasukkan manual; tidak wajib migrasi semua Word.

Sebelum mulai: pastikan siapa menggunakan akun divisi, siapa memegang/reset sandi, cara memberi tahu perubahan, izin data/foto/hosting, lokasi backup, dan dukungan saat gangguan. Selama izin belum ada, tetap dummy.

## Ukuran hasil yang dicatat

| Ukuran | Cara mengukur | Target |
| --- | --- | --- |
| Waktu mencatat temuan | Dari buka form sampai tersimpan | Baseline demo dahulu; belum disepakati |
| Waktu mencari status | Tugas mencari satu temuan memakai filter | Baseline dahulu |
| Progres terbaru | Jumlah temuan aktif yang diperbarui sebelum rapat dibanding total yang ditinjau | Definisi periode dan target dibahas saat pilot |
| Keterbacaan rapat | Peserta dapat membaca uraian/status/penanggung jawab di proyektor | Umpan balik peserta |
| Kebenaran ringkasan | Cocokkan daftar/filter dengan hitungan manual fixture | Tidak boleh salah hitung |
| Adopsi | Divisi yang benar-benar mencoba dan hambatan penggunaan | Jangan menganggap akun dibuat = aktif memakai |

Pengguna menekankan pencatatan cepat, ringkasan daftar per divisi, serta dashboard pembuka. Pemilihan tiga KPI formal belum eksplisit; tidak mengarang target profit atau angka efisiensi.

## Risiko dan penanganan

| Risiko | Dampak | Penanganan awal/pemilik |
| --- | --- | --- |
| Akun bersama tidak menunjukkan individu | Penelusuran hanya sampai divisi | Terima sesuai keputusan; UI jujur; ICT reset jika akses tidak lagi sesuai |
| Semua divisi boleh mengedit | Salah koreksi/penugasan | Validasi, audit, version conflict, batal tanpa hapus |
| Progres tidak diperbarui | Rapat tetap menggunakan data lama | Kebiasaan pembaruan disepakati supervisor/perwakilan; tampilkan waktu update |
| Beberapa divisi, satu status | Selesai terlalu cepat | Tegaskan Selesai berarti semua pekerjaan temuan selesai; detail kontribusi dalam catatan |
| Foto opsional, tanpa pemeriksaan aplikasi | Status bukan bukti inspeksi | Jangan menyebut selesai terverifikasi; proses keselamatan tetap kewenangan perusahaan |
| VPS pribadi/layanan lain | Gangguan atau data hilang | Dummy dahulu, inventaris, batas resources, salinan luar VPS, restore test |
| Waktu pengembang terbatas | Demo/MVP terlambat | D0 dahulu, backlog bertahap, tidak menambah fitur tertunda |
| Dashboard ramai/angka disalahartikan | Keputusan keliru | Rumus/label periode jelas, hitungan unik, tidak pakai leaderboard |
| Zona/lokasi dan jaringan belum diketahui | Salah tanggal atau sulit akses | Asia/Jakarta sementara, konfirmasi lokasi/perangkat/jaringan saat presentasi |

## Keputusan setelah presentasi

**Lanjut pilot** jika alur dimengerti, pihak terkait bersedia, data/hosting diizinkan, dan jalur inti serta akses/backup lolos. **Perbaiki** jika alur sulit, angka salah, atau tugas operator terlalu berat. **Tunda penggunaan nyata** jika izin atau pemilik operasi belum jelas. Keputusan ini tidak memerlukan penambahan workflow approval dalam aplikasi.

Catatan presentasi kelak: tanggal, peserta/jabatan/divisi, versi demo, yang berhasil, kendala, perubahan prioritas, keputusan, pemilik dan waktu tindak lanjut.

## Verifikasi teknis demo lokal D0-07 — 9 November 2026

Skenario 1–6 di atas diuji dengan data dummy pada localhost oleh pengembang, **bukan** presentasi kepada leader. Akun Camp sudah login di browser. Dashboard menampilkan 17 temuan valid sebelum uji; filter Camp+Transport pada daftar menghasilkan 13 temuan unik. Satu temuan dummy `SM-2026-6af1c29b794eabcf6e453600` dibuat dengan dua penanggung jawab tanpa target/foto, status awal Diproses. Tertunda tanpa alasan ditahan form; dengan alasan/catatan berhasil. Selesai dengan konfirmasi berhasil. Audit menampilkan perubahan status/alasan/waktu dan nama akun; 11 catatan progres dan 12 audit sebelum uji konflik tampil pada dua halaman, termasuk entri pertama di halaman kedua.

Dua tab akun Camp menguji konflik progres dan koreksi. Draf serta perbandingan nilai semula/draf/terbaru tampil. Uji ini menemukan `DataCloneError` pada rebase objek reaktif Vue; fungsi penyalin diperbaiki lalu alur diulang. Rebase progres mempertahankan catatan/prioritas draf dan berhasil menyimpan versi baru. Rebase koreksi mempertahankan lokasi draf serta mengambil uraian terbaru dari tab kedua, lalu berhasil menyimpan. Akun dummy ICT kemudian mengoreksi lokasi melalui API lokal; audit mencatat aktor `ict` dan before/after yang cocok. Tidak memakai data operasional atau mengubah akun/sandi.

**Batas demo D0-07 saat itu:** foto, PDF, batal/pulihkan, administrasi akun, dashboard grafik/tren/tindak lanjut belum tersedia. M-03 dan M-02 pada 10 November menambahkan batal/pulihkan serta foto opsional privat untuk demo lokal; M-06 sebagian kini menyediakan administrasi akun divisi; PDF, master divisi dan dashboard lanjutan tetap terbuka. Status Selesai hanya pernyataan akun, bukan verifikasi keselamatan. Draf tidak tahan refresh/tutup tab. Belum ada uji pada proyektor, perangkat HP fisik, HTTPS/VPS, jaringan kantor, atau presentasi/keputusan leader. Browser uji pada tahap ini tetap lebar 841 px meski override 390/1440 diminta; jangan menyebutnya bukti responsif pada kedua ukuran itu.

Sebelum presentasi nyata, buka demo lokal dan cek login, angka dashboard vs daftar, formulir, status, dan riwayat pada perangkat yang akan dipakai. Siapkan jaringan/layar cadangan dan jelaskan fitur tertunda. Catat waktu pencatatan dan pencarian status sebagai baseline; belum ada target angka yang disetujui.
