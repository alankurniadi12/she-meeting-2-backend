# Model data dan kamus kolom

Rancangan teknis untuk MongoDB; skema/collection bisnis belum diimplementasikan pada tahap 01. Fondasi baru menghubungkan driver dan mem-ping database development; belum ada seed temuan/akun. Semua ID API berupa string ObjectId; ID internal MongoDB tetap ObjectId. Tanggal kalender menggunakan YYYY-MM-DD, timestamp UTC ISO 8601. Zona tampilan/asumsi bisnis Asia/Jakarta; zona lokasi perusahaan belum dikonfirmasi.

## Entitas

| Collection | Kolom utama | Aturan |
| --- | --- | --- |
| divisions | _id, code, name, active, version, audit[], createdAt, updatedAt | code/nama ternormalisasi unik; nama dapat diubah dengan audit; nonaktif tidak menghapus histori |
| accounts | _id, username, displayName, divisionId, role, passwordHash, active, sessionVersion, audit[], timestamps | role DIVISION atau ADMIN; satu akun aktif DIVISION per divisi; admin boleh tanpa divisionId; tidak ada nama pribadi wajib |
| sessions | _id, accountId, sessionVersion, expiresAt, lastSeenAt | Hanya diakses server, TTL expiresAt; periksa kedaluwarsa eksplisit sebelum melayani permintaan |
| findings | Data temuan, version, progressEntries[], attachments[], audit[] | Status/progres dan audit diperbarui atomik dalam dokumen yang sama |

Tidak ada tabel persetujuan, supervisor, meeting scheduling, atau status per divisi. Master lokasi sementara teks bebas; autocomplete dari nilai terdahulu dapat ditunda.

Audit administrasi akun tidak memuat passwordHash, sandi, token CSRF atau session ID. Reset hanya menyimpan event PASSWORD_RESET dan metadata aktor/waktu/versi. Audit before/after berlaku untuk field administratif nonrahasia.

## Finding

| Field | Jenis | Validasi/default usulan |
| --- | --- | --- |
| _id | ObjectId | Dibuat server |
| reference | string unik | Dibuat server, misalnya format SM-YYYY-<ObjectId>; jangan hitung dengan count+1 |
| reportedDate | date-only | Wajib, bukan tanggal masa depan dalam zona aplikasi |
| description | string | Wajib, trim, 5–3000 karakter |
| location | string | Wajib, 1–200 karakter |
| reporterName | string | Wajib, 1–120 karakter; input bebas, tidak mensyaratkan akun |
| reporterDivisionId | ObjectId | Wajib, master divisi aktif pada laporan baru |
| responsibleDivisionIds | ObjectId[] | Wajib minimal 1, unik, semua divisi aktif saat dipilih |
| priority | LOW / MEDIUM / HIGH / null | null = Belum dinilai; jangan mengarang tingkat risiko otomatis |
| targetDate | date-only / null | Opsional, default null; tidak sebelum reportedDate |
| status | IN_PROGRESS / ON_HOLD / COMPLETED | Default IN_PROGRESS, tidak ada NEW atau PENDING_APPROVAL |
| holdReason | string / null | Wajib 1–2000 saat ON_HOLD; null pada status lain, alasan lama tetap dalam audit |
| completedAt | timestamp / null | Diisi server saat beralih COMPLETED; bukan tanggal verifikasi |
| cancelledAt, cancellationReason | timestamp/null, string/null | Penanda batal terpisah; alasan wajib saat batal |
| cancelledBy | actor snapshot / null | Diisi server |
| progressEntries | array | Catatan berisi id, text 1–2000, actor, timestamp; append-only untuk MVP |
| attachments | array | Metadata foto, bukan biner/base64; maksimal 10 foto aktif per temuan |
| audit | array | Append-only oleh server; before/after untuk field yang berubah, pelaku, waktu, revision, mutationId |
| version | integer | Awal 1, naik setiap mutasi temuan, termasuk progres/foto/pembatalan |
| createdBy, updatedBy | actor snapshot | accountId, username, divisionId, divisionName/displayName saat tindakan |
| createdAt, updatedAt | timestamp | Dibuat server |

Kode divisi nonaktif tetap dapat dibaca pada data lama; edit uraian tidak otomatis mewajibkan mengganti penugasan lama yang tidak berubah. Perubahan pilihan divisi hanya menerima divisi aktif. UI tidak memaksa foto atau target.

## Audit, konflik, dan ukuran dokumen

Usulan sederhana untuk skala awal: audit/progres/metadata foto tertanam di finding sehingga perubahan bisnis dan audit tersimpan dalam satu write atomik. Update memakai filter _id + version, lalu set field, append audit/progres, dan increment version. Backend tidak menerima array audit/pelaku dari klien. Riwayat dipaginasi dan tidak dikirim pada daftar.

MongoDB mendukung atomisitas satu dokumen dan kondisi versi untuk mencegah overwrite. [Sumber MongoDB](https://www.mongodb.com/docs/manual/core/write-operations-atomicity/).

Array akan tumbuh. Jangan menghapus audit diam-diam: ukur BSON sebelum menulis, gunakan ambang aplikasi 8 MiB dan respons 409 HISTORY_CAPACITY_REACHED jika terlampaui. ICT perlu memigrasikan histori ke penyimpanan terpisah dengan transaksi sebelum melanjutkan temuan tersebut. Ini keterbatasan rancangan demo, bukan retensi perusahaan. Batas BSON MongoDB 16 MiB; foto disimpan terpisah. [Batas MongoDB](https://www.mongodb.com/docs/manual/reference/limits/#bson-document-size).

mutationId UUID per operasi memungkinkan retry aman: create memakai indeks unik createMutationId, update memeriksa mutationId yang sudah tercatat sebelum konflik versi. Batasi ukuran payload dan daftar field yang dapat diedit; jangan meneruskan operator kueri MongoDB dari input.

## Foto

Metadata: attachmentId, storageKey acak, originalName yang dibersihkan, mime, sizeBytes, kind INITIAL/PROGRESS/COMPLETION, uploadedAt, uploadedBy. Usulan maksimal 5 MiB/foto, JPEG/PNG/WebP saja, maksimal 10 foto. Validasi signature/decoding dan ukuran; SVG/HTML ditolak. Simpan file di volume VPS privat, bukan folder static publik; akses via API login. Penghapusan foto tidak tersedia di MVP, koreksi dapat menambah foto dengan catatan.

Unggah: tulis file sementara, verifikasi, pindah ke lokasi final, lalu update finding+audit secara atomik. Bila update gagal, hapus file baru yang tidak direferensikan; proses pembersihan orphan memeriksa metadata sebelum menghapus. File yang sudah terikat tidak dihapus saat batal. Tidak mengklaim filesystem dan MongoDB memiliki transaksi bersama.

## Indeks awal

- accounts: username unik; partial unique divisionId untuk role DIVISION yang active=true.
- divisions: code unik dan normalizedName unik.
- sessions: expiresAt TTL, accountId.
- findings: reference unik; createMutationId unik; reportedDate/_id, responsibleDivisionIds/reportedDate, status/targetDate, cancelledAt.
- Penambahan indeks mengikuti pengukuran; pencarian kecil memakai escaped text yang dibatasi panjang atau text index, bukan regex bebas pengguna.

## Definisi waktu dan statistik

Lihat [UI_SPEC](UI_SPEC.md). isNew, isOverdue dan angka dashboard dihitung dari data, bukan kolom boolean tersimpan. completedAt tidak pernah dianggap tanggal verifikasi. Koreksi COMPLETED ke status aktif mengosongkan completedAt; nilai lama tetap dalam audit. Penyelesaian berikutnya membuat waktu baru, sehingga statistik merupakan keadaan terkini, bukan ledger historis yang kebal koreksi.
