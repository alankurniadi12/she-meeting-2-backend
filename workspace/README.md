# Launcher workspace opsional

Salinan launcher lokal untuk menjalankan kedua repo bersama. Folder ini bukan root aplikasi backend dan bukan target deployment.

Untuk memulihkan layout workspace pada mesin baru:

1. Clone frontend sebagai `she-meeting-frontend` dan backend sebagai `she-meeting-backend` di folder induk yang sama.
2. Salin `package.json` dari folder ini ke folder induk, serta `scripts/` dari sini ke `scripts/` pada folder induk. Jangan menimpa file lokal yang sudah dimodifikasi.
3. Instal dependency di masing-masing repo dengan npm ci.
4. Dari folder induk, jalankan npm run db:dev di satu terminal, lalu npm --prefix she-meeting-backend run seed:demo sekali untuk akun dummy, dan npm run dev di terminal lain.

Kredensial acak lokal berada pada she-meeting-backend/.local/demo-accounts.json; jangan commit file ini. Seed ulang tidak mereset akun atau temuan yang ada. D0-02 menambahkan login/logout/sesi; D0-03 menambahkan 18 fixture temuan dan dashboard ringkas. D0-04 menambah daftar/ringkasan temuan dengan filter/pagination dan route /login, /dashboard, /findings. D0-05 menambah /findings/new, detail dan koreksi /edit, progres/status serta fondasi audit/versi/retry. Riwayat lengkap D0-06 dan grafik/tren dashboard lengkap belum tersedia. npm test induk tetap backend; jalankan npm --prefix she-meeting-frontend test untuk 5 tes frontend. Petunjuk uji integrasi dan konfigurasi cookie ada di README backend.

Kedua aplikasi juga dapat dijalankan mandiri; lihat README repo masing-masing. Dokumentasi kanonis ada di `../docs/`. Salinan launcher di sini perlu diselaraskan jika launcher di folder induk berubah.
