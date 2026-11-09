# Instruksi backend SHE Meeting

- Baca `docs/PROJECT_CONTEXT.md` (bagian paling akhir), `docs/PRD.md`, dan dokumen relevan sebelum merencanakan atau mengubah aplikasi.
- Komunikasi bahasa Indonesia yang praktis, hangat dan kritis. Fokus satu perusahaan, MVP sederhana untuk rapat nyata; tidak menambah SaaS, billing atau AI tanpa permintaan.
- Stack pilihan pengguna: JavaScript, Express.js, MongoDB. Bedakan keputusan pengguna dari asumsi prototipe.
- Akun bersama per divisi; semua akun boleh mengedit lintas divisi; audit hanya mengidentifikasi akun divisi. Status awal Diproses, Tertunda dengan alasan, Selesai; Baru badge usia tujuh hari. Tidak ada approval supervisor. Foto dan target opsional, satu status untuk beberapa penanggung jawab.
- Gunakan data dummy. Hak akses wajib diperiksa server; IT Support bukan otomatis otoritas keselamatan. Jangan mengklaim siap produksi atau disetujui perusahaan tanpa bukti.
- Setiap tahap/perubahan wajib menyelaraskan docs yang relevan serta BACKLOG dan DEVELOPMENT_LOG; perbarui README jika cara menjalankan berubah, DECISIONS dan PROJECT_CONTEXT jika ada keputusan penting.
- Branch kerja dev; prod kandidat rilis. Jangan force-push atau menimpa riwayat remote. Jangan commit secret, .env, node_modules, database/foto/log lokal.
- `workspace/` menyimpan launcher opsional untuk folder induk dua repo; selaraskan salinannya bila launcher workspace berubah.
