# Git dan sinkronisasi dua repo

Permintaan pengguna 9 November 2026: unggah frontend/backend ke repo yang ditunjuk dan sediakan branch dev/prod pada masing-masing repo. Workspace induk bukan repo Git; dua folder aplikasi adalah repo mandiri.

## Repo dan branch

| Aplikasi | Origin | Branch kerja | Branch rilis |
| --- | --- | --- | --- |
| Frontend | https://github.com/alankurniadi12/she-meeting-2-frontend.git | dev | prod |
| Backend | https://github.com/alankurniadi12/she-meeting-2-backend.git | dev | prod |

Checkpoint awal kedua branch berisi fondasi D0-01. Nama prod tidak berarti MVP lengkap, sudah disetujui perusahaan atau sudah dideploy. Push tidak otomatis menjadi instruksi menghubungkan hosting/menjalankan deployment. GitHub teramati memilih dev sebagai default branch setelah push awal. Branch protection, CI/CD dan deployment host belum dikonfigurasi oleh tahap ini.

## Dokumentasi satu sumber

Dokumen bersama berada di **repo backend, docs/**. Frontend README memberi tautan ke dokumen backend. Pada workspace pengguna, `docs` di folder induk merupakan symlink ke `she-meeting-backend/docs`, dan `PROJECT_CONTEXT.md` di induk merupakan symlink ke `she-meeting-backend/docs/PROJECT_CONTEXT.md`. Jalur lama tetap bisa dibaca/diedit; hasil perubahan masuk repo backend.

Root workspace README, package.json dan script tetap dapat digunakan secara lokal. Backend workspace/ menyimpan salinan launcher untuk memulihkan layout dua repo pada mesin baru. Jika launcher induk berubah, selaraskan salinan workspace/ dan dokumentasi terkait. Masing-masing repo memiliki README, .gitignore, .nvmrc dan AGENTS sendiri agar dapat di-clone mandiri.

## Kerja harian

Dari folder aplikasi yang dikerjakan:

```sh
git switch dev
git pull --ff-only origin dev
# ubah kode dan dokumen yang relevan
git status --short
git diff
# jalankan validasi sesuai perubahan
git add <file-yang-sudah-ditinjau>
git commit -m "Jelaskan perubahan"
git push origin dev
```

Jika perubahan frontend memengaruhi API/UI/PRD, commit dokumen bersama pada backend/dev juga. Dua repo tidak memiliki transaksi commit bersama; catat keterkaitan perubahan dalam pesan commit/PR bila diperlukan. Jangan membuat salinan PRD frontend yang berbeda sendiri.

## Promosi ke prod

Setelah checkpoint dev diuji dan pengguna meminta promosi, gunakan PR dev → prod atau fast-forward yang ditinjau. Jangan force-push untuk menyamakan branch yang berbeda. Setelah promosi, kembali ke dev untuk pekerjaan berikutnya. Tidak semua perubahan dokumen otomatis harus dipromosikan ke prod pada pengembangan selanjutnya.

## Batas staging

Masing-masing repo mengabaikan node_modules, dist, coverage, .env/.env.*, .local, uploads, key/pem dan log. .env.example tanpa kredensial serta package-lock.json sengaja dilacak. File database, screenshot lokal, kredensial dan data operasional tidak diunggah. Periksa git status/diff sebelum setiap commit; .gitignore tidak menggantikan peninjauan konten.

## Pemeriksaan sinkronisasi

```sh
git status --short --branch
git branch -vv
git remote -v
git ls-remote origin refs/heads/dev refs/heads/prod
```

Bandingkan SHA lokal dan remote kedua branch, serta pastikan working tree bersih. Gunakan identitas Git pengguna yang sudah dikonfigurasi; tidak mengganti kredensial atau membuat token baru sebagai bagian upload ini.

## Hasil unggahan awal — 9 November 2026

Unggahan awal berhasil dan remote diverifikasi menggunakan git ls-remote. Kedua repo memiliki dev/prod dengan upstream masing-masing, default GitHub dev, dan branch lokal aktif dev.

| Repo | Commit fondasi awal | Verifikasi saat unggahan awal |
| --- | --- | --- |
| Frontend | 8b25cf90e3d6410ff0066b1b74a7a142ec9d1a4e | dev/prod lokal sama dengan remote; working tree bersih |
| Backend | cadd492c5528516196da291f380bb715bb7d58f6 | dev/prod lokal sama dengan remote; working tree bersih |

Commit di atas adalah checkpoint fondasi pertama. Pencatatan hasil verifikasi ini dikirim dalam commit dokumentasi berikutnya pada backend, kemudian prod di-fast-forward sebagai bagian penyiapan awal yang sama. Gunakan git rev-parse/ls-remote untuk posisi terbaru, jangan menganggap hash awal selalu HEAD.
