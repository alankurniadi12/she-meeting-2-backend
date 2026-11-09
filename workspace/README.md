# Launcher workspace opsional

Salinan launcher lokal untuk menjalankan kedua repo bersama. Folder ini bukan root aplikasi backend dan bukan target deployment.

Untuk memulihkan layout workspace pada mesin baru:

1. Clone frontend sebagai `she-meeting-frontend` dan backend sebagai `she-meeting-backend` di folder induk yang sama.
2. Salin `package.json` dari folder ini ke folder induk, serta `scripts/` dari sini ke `scripts/` pada folder induk. Jangan menimpa file lokal yang sudah dimodifikasi.
3. Instal dependency di masing-masing repo dengan npm ci.
4. Dari folder induk, jalankan npm run db:dev di satu terminal dan npm run dev di terminal lain.

Kedua aplikasi juga dapat dijalankan mandiri; lihat README repo masing-masing. Dokumentasi kanonis ada di `../docs/`. Salinan launcher di sini perlu diselaraskan jika launcher di folder induk berubah.
