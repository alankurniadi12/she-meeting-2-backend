# Lingkungan, deployment, dan operasi

Rencana hosting, belum deployment. Fondasi lokal D0-01 sudah tersedia dan diuji; cara menjalankannya ada pada [README utama](../README.md). Script `db:dev` memakai mongod lokal port 27027 dan folder `.local/mongodb`, tanpa autentikasi, khusus development dan jangan disalin sebagai konfigurasi server internet. Dua lockfile aplikasi tersedia. Belum ada Dockerfile/Compose, konfigurasi Vercel, DNS/TLS, atau perubahan VPS. Pilihan pengguna: frontend Vercel, domain Rumahweb, VPS pribadi Sumopod 2 vCPU / 4 GB / 60 GB untuk backend dan MongoDB demo. Semua data dummy. Hosting operasional dievaluasi sesudah persetujuan leader.

## 1. Sebelum bootstrap/deployment

- Lokal: periksa Node/npm, Git, Docker atau MongoDB lokal yang tersedia; baca struktur dua folder aplikasi. Catat versi sebelum memasang stable terbaru yang kompatibel. Jangan menganggap tutorial lama sama dengan versi saat bootstrap.
- VPS: periksa OS/arsitektur, disk/RAM kosong, layanan yang sudah berjalan, port, firewall, akses SSH, kemampuan restart, dan metode deployment yang biasa dipakai pengguna. Kapasitas paket bukan kapasitas kosong.
- Domain: belum ada nama domain/subdomain aktual dalam konteks. Pengguna perlu menyediakan nama host serta akses konfigurasi ketika deployment dimulai; jangan menulis token/kunci ke dokumen.
- Izin data nyata belum ada. Demo dummy tidak boleh diam-diam diisi data perusahaan.

## 2. Lingkungan

| Lingkungan | Frontend | Backend/DB | Data |
| --- | --- | --- | --- |
| Development | Vite lokal | Express lokal, MongoDB dev | Dummy |
| Test | Build/test lokal/CI | Database terisolasi dengan nama test | Fixture dapat direset |
| Demo | Vercel pada custom subdomain | VPS privat, database demo dan volume terpisah | Dummy saja |
| Operasional | Belum diputuskan | Belum diputuskan perusahaan | Belum diizinkan |

Gunakan database, direktori foto dan rahasia sesi terpisah. Seed/reset hanya bekerja dengan ALLOW_DEMO_SEED=true dan APP_ENV=development/test/demo; jangan tersedia sebagai endpoint publik. Tidak menyimpan akun/sandi demo tetap di source untuk host internet; seed menerima sandi melalui environment/input privat.

## 3. Topologi yang disarankan

Frontend `she.<domain-pengguna>` ke Vercel; API `she-api.<domain-pengguna>` ke VPS. Keduanya HTTPS, satu registrable domain untuk mendukung cookie same-site. Host ini placeholder.

Reverse proxy (Nginx/Caddy mengikuti yang sudah ada) meneruskan ke Express pada loopback/private network. MongoDB hanya private/loopback, dengan autentikasi; port 27017 dan port Express tidak dibuka ke internet. Hanya HTTPS serta akses administratif yang dibatasi. Tidak mengganti seluruh konfigurasi firewall/proxy VPS tanpa meninjau layanan lain.

Kandidat pengelolaan proses: Docker Compose backend+MongoDB dengan volume persisten dan batas resource; alternatif service manager yang sudah dipakai di VPS. Belum membuat compose aktual karena OS/layanan belum diperiksa. Tidak perlu Kubernetes. MongoDB demo satu instance dan tanpa HA; core temuan memakai single-document atomic write sehingga tidak memerlukan transaksi multi-document/replica set.

## 4. Konfigurasi yang perlu disediakan

Ini daftar kebutuhan variabel, bukan secret nyata atau konfigurasi yang sudah diuji.

| Variabel | Lingkup | Contoh/arti |
| --- | --- | --- |
| NODE_ENV | Backend | production pada VPS demo |
| APP_ENV | Backend | demo; membedakan dummy dari operasional |
| PORT, HOST | Backend | Port internal dan bind private/loopback |
| MONGODB_URI | Backend rahasia | URI autentikasi database; tidak pernah di VITE_* |
| MONGODB_DB | Backend | she_meeting_demo / dev / test |
| SESSION_SECRET | Backend rahasia | Acak kuat, rotasi mencabut sesi |
| SESSION_TTL_HOURS | Backend | Asumsi 12 |
| ALLOWED_ORIGINS | Backend | Origin frontend eksplisit, tanpa wildcard |
| TRUST_PROXY | Backend | Jumlah/jaringan proxy yang benar-benar dilalui; jangan true tanpa batas |
| COOKIE_SECURE | Backend | true pada HTTPS, lokal false hanya untuk development |
| APP_TIMEZONE | Backend | Asia/Jakarta sementara; perlu konfirmasi zona lokasi perusahaan |
| UPLOAD_DIR | Backend | Volume privat persisten di luar webroot |
| MAX_UPLOAD_BYTES | Backend | Asumsi 5242880 |
| ALLOW_DEMO_SEED | Tool seed | false kecuali perintah seed demo sengaja dijalankan |
| VITE_API_BASE_URL | Frontend publik | URL API /api/v1; boleh publik, tanpa kredensial |
| VITE_APP_ENV | Frontend publik | demo, tampilkan badge Data Demo |

Frontend mengirim credentials; API mengirim CORS allow-origin eksplisit dan allow-credentials serta Vary: Origin. Cookie host-only Secure/HttpOnly/SameSite=Lax, CSRF terikat sesi, dan pemeriksaan Origin sesuai arsitektur. Uji pada browser nyata, bukan hanya curl. Preview vercel.app lintas site tidak otomatis diizinkan backend demo.

## 5. Urutan deployment dummy

1. Pastikan build, tes kritis, dan smoke lokal lulus. Catat commit dan versi runtime/dependency.
2. Buat user layanan/database yang terbatas dan direktori volume tersendiri tanpa menyentuh aplikasi VPS lain.
3. Jalankan MongoDB privat dengan volume, autentikasi, dan resource yang cocok; jalankan backend internal, health/readiness dan index initialization idempotent.
4. Seed dummy serta akun demo memakai sandi yang disediakan privat; jangan tampilkan sandi dalam log/reply publik.
5. Pasang route reverse proxy dan TLS untuk API host. Periksa port internal tidak terbuka publik.
6. Konfigurasi Vercel root directory `she-meeting-frontend`, build `npm run build`, output `dist`. Atur Node stable LTS yang cocok dengan lockfile/build.
7. Atur DNS dan custom domain frontend, VITE_API_BASE_URL dan allowlist origin backend. Bangun ulang frontend jika env publik berubah.
8. Pasang SPA deep-link rewrite sesuai konfigurasi frontend; uji refresh `/findings/<id>` agar tidak 404. [Panduan Vite Vercel](https://vercel.com/docs/frameworks/frontend/vite).
9. Uji login/logout, sesi ganda, edit lintas divisi, konflik, unggah privat, PDF dan restart/persistensi.
10. Jalankan backup dan satu restore terisolasi; catat hasil. Jangan menyatakan siap dipakai operasional hanya karena URL dapat dibuka.

Tidak melakukan deployment, SSH, perubahan DNS, atau pembelian layanan pada tahap dokumentasi ini.

## 6. Backup dan pemulihan

Pemilik: pengguna dari tim ICT. Usulan demo: backup harian, simpan 7 versi harian, serta backup sebelum perubahan skema/deployment besar. Jadwal, retensi dan tujuan penyimpanan operasional masih perlu persetujuan perusahaan.

Isi: database (accounts/divisions/findings/audit), file foto yang direferensikan, manifest waktu/commit/versi/count/checksum. Konfigurasi nonrahasia disertakan; rahasia disimpan terpisah dan dibatasi. Sessions tidak dibawa ke restore sehingga login lama tidak hidup kembali.

Karena DB dan file terpisah, gunakan jendela pemeliharaan singkat yang memblokir semua write, tunggu unggahan/operasi selesai, lalu dump DB dan salin foto konsisten. Jika ingin online backup tanpa jendela ini, perlu desain snapshot/oplog terpisah; belum masuk demo.

Salinan pada disk VPS yang sama bukan perlindungan jika VPS hilang. Simpan salinan terenkripsi di lokasi di luar VPS yang dipilih pengguna. Lokasi ini belum tersedia/dikonfigurasi. Tidak menambahkan biaya layanan baru tanpa kebutuhan/keputusan.

Restore: pilih manifest → pulihkan DB ke nama terisolasi → foto ke folder terisolasi → cocokkan jumlah/reference/checksum dan audit → jalankan smoke login/data/foto/PDF → catat durasi dan kendala. Jangan restore langsung menimpa data yang berjalan untuk sekadar tes. Recovery point/time operasional belum dijanjikan.

## 7. Pemantauan dan rollback

Pantau ruang disk, RAM/CPU, ukuran foto/database, restart, error rate, backup terakhir dan kemampuan login. Rotasi log, jangan merekam sandi/token, serta jangan menaruh uraian sensitif ke log secara default. Tetapkan batas PDF dan unggah sesuai rancangan; uji dahulu.

Rollback mengembalikan build frontend/backend sebelumnya dan konfigurasi yang cocok; migrasi harus memiliki backup dan rencana kompatibilitas. Database jangan didowngrade otomatis hanya karena image aplikasi dirollback. Sebelum beralih ke data nyata: izin hosting/data, kapasitas, backup/restore, daftar akun dan tanggung jawab harus disepakati.
