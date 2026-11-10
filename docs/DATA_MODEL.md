# Model data dan kamus kolom

Rancangan teknis untuk MongoDB. D0-02 mengimplementasikan accounts, divisions, sessions, loginAttempts dan seed akun/divisi dummy. D0-03 menambah collection findings berisi 18 fixture dummy dan agregat dashboard; D0-04 menambah pembacaan daftar/summary, filter dan badge turunan server. D0-05 menambah create/detail/koreksi/progres dengan audit bisnis/receipt/versi atomik. Histori fixture awal tetap DEMO_SEED; API/tampilan histori lengkap tersedia pada D0-06. ID entitas API berupa string ObjectId; ID entitas internal tetap ObjectId. Pengecualian internal: sessions/loginAttempts memakai ID hash string dan tidak diekspos sebagai entitas API. Tanggal kalender menggunakan YYYY-MM-DD, timestamp UTC ISO 8601. Zona tampilan/asumsi bisnis Asia/Jakarta; zona lokasi perusahaan belum dikonfirmasi.

## Entitas

| Collection | Kolom utama | Aturan |
| --- | --- | --- |
| divisions | _id, code, name, active, version, audit[], createdAt, updatedAt | code/nama ternormalisasi unik; nama dapat diubah dengan audit; nonaktif tidak menghapus histori |
| accounts | _id, username, displayName, divisionId, role, passwordHash, active, sessionVersion, version, audit[], timestamps | role DIVISION atau ADMIN; satu akun aktif DIVISION per divisi; admin boleh tanpa divisionId; tidak ada nama pribadi wajib |
| sessions | _id (SHA-256 token cookie), accountId, sessionVersion, csrfToken, createdAt, expiresAt | Hanya diakses server, TTL expiresAt; kedaluwarsa eksplisit, absolut 12 jam; tidak menyimpan token cookie mentah |
| loginAttempts | _id (hash window+IP/username), count, expiresAt | Counter fixed window 15 menit, TTL; hanya server, bukan audit pengguna |
| findings | Data temuan, version, progressEntries[], attachments[], audit[], mutationReceipts[], createMutationId/seedKey opsional | D0-05: write inti atomik, CAS versi dan idempotensi; pembacaan riwayat lengkap tersedia pada D0-06. |

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

## Fixture temuan D0-03

`npm run seed:demo` development loopback kini menambah 18 temuan sintetik (16 tidak batal, 2 batal) dengan status, multi-penanggung jawab, tanggal laporan bulan ini/sebelumnya, prioritas kosong/LOW/MEDIUM/HIGH serta target kosong/hari ini/lewat. Tanpa foto. Tanggal relatif terhadap waktu seed pertama pada APP_TIMEZONE; seed ulang tidak memperbarui tanggal, progres, versi, pembatalan, audit atau akun yang sudah ada.

`seedKey` unik parsial string, format D0-03-finding-01 sampai 18, menjaga retry tanpa overwrite; reference SM-DEMO-<ObjectId> unik. `createdBy`/`updatedBy` dan event `DEMO_SEED` memakai aktor sistem `seed.demo`, source DEMO_SEED, accountId/divisionId null; tidak mengklaim Admin ICT atau individu melakukan edit melalui UI. Ini metadata fixture, bukan implementasi audit bisnis. Progres/attachment kosong, version=1 saat seed. Kontrak aktor mutasi melalui sesi tetap accountId akun nyata pada tahap berikutnya.

Indeks yang benar-benar dibuat sampai D0-04: reference unik, seedKey unik parsial string, cancelledAt + responsibleDivisionIds, reportedDate + _id descending, updatedAt + _id descending. D0-05 menambah indeks createMutationId unik parsial string; indeks status tambahan mengikuti kebutuhan tahap berikutnya. List memakai projection allowlist dan tidak membawa array histori/foto ke output; descriptionExcerpt dipotong maks. 240. Filter/status/target usia dihitung dari field sumber, bukan boolean tersimpan. Seed menambah yang belum ada; data nonfixture tidak dihapus/ditimpa.

## Audit, konflik, dan ukuran dokumen

Usulan sederhana untuk skala awal: audit/progres/metadata foto tertanam di finding sehingga perubahan bisnis dan audit tersimpan dalam satu write atomik. Update memakai filter _id + version, lalu set field, append audit/progres, dan increment version. Backend tidak menerima array audit/pelaku dari klien. Riwayat dipaginasi dan tidak dikirim pada daftar.

MongoDB mendukung atomisitas satu dokumen dan kondisi versi untuk mencegah overwrite. [Sumber MongoDB](https://www.mongodb.com/docs/manual/core/write-operations-atomicity/).

Array akan tumbuh. Jangan menghapus audit diam-diam: ukur BSON sebelum menulis, gunakan ambang aplikasi 8 MiB dan respons 409 HISTORY_CAPACITY_REACHED jika terlampaui. ICT perlu memigrasikan histori ke penyimpanan terpisah dengan transaksi sebelum melanjutkan temuan tersebut. Ini keterbatasan rancangan demo, bukan retensi perusahaan. Batas BSON MongoDB 16 MiB; foto disimpan terpisah. [Batas MongoDB](https://www.mongodb.com/docs/manual/reference/limits/#bson-document-size).

mutationId UUID per operasi memungkinkan retry aman: create memakai indeks unik createMutationId, update memeriksa mutationId yang sudah tercatat sebelum konflik versi. Batasi ukuran payload dan daftar field yang dapat diedit; jangan meneruskan operator kueri MongoDB dari input.

## Realisasi mutasi D0-05

Field core divalidasi server sesuai tabel. Create menggunakan reference SM-<tahun laporan>-<ObjectId> dan version=1, status IN_PROGRESS, completedAt/holdReason/cancelledAt null; actor dari akun sesi, tanpa nama individu wajib. Prioritas/target/foto boleh kosong. Pembaruan memakai _id+version+tidak batal, append audit/progres/receipt dan increment bersama.

`mutationReceipts[]` adalah metadata internal `{mutationId,requestHash,result}`; result acknowledgement id/reference/version/status/updatedAt yang immutable untuk retry. Hash menyertakan jenis operasi, akun dan payload canonical. Array tidak dikirim pada API detail/list. createMutationId unik parsial menjaga retry create; UUID dari klien bukan reference temuan. Capacity guard menghitung BSON kandidat lengkap (audit/progres/receipt) sebelum write, batas 8 MiB. Receipt ikut kapasitas; tidak menghapus histori untuk memberi tempat.

Audit menyimpan action CREATED/CORRECTED/PROGRESS_UPDATED, UUID event, actor snapshot, timestamp, revision, mutationId, before/after kolom berubah, correctionReason bila ada, divisionSnapshots nama/kode divisi yang dirujuk, dan progressEntryId jika menambah teks. Teks progres append-only pada progressEntries dengan actor/waktu/revisi. Saat master berubah nama, snapshot event tetap nama saat mutasi. Fixture DEMO_SEED lama tidak dipalsukan sebagai audit akun. Detail hanya menampilkan 10 progres terakhir dan total, bukan seluruh audit; pembacaan paginasi ditulis pada D0-06.

UI uji manual menambah satu temuan dummy di luar 18 fixture seed, lalu mengoreksi/progres sampai Selesai. Seed tetap insert-only 18 fixture; jumlah total development dapat bertambah dari pemakaian form dan bukan konstanta sistem.

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

## M-03 — perubahan pembatalan

`cancelledAt`, `cancellationReason` dan `cancelledBy` berubah bersama pada aksi CANCELLED; RESTORED mengosongkan ketiganya. Alasan restore tetap disimpan pada event audit `reason`, bukan field aktif temuan. Status, completedAt, progres dan audit lama dipertahankan. Mutasi memakai CAS `_id` + `version` + keadaan batal yang diharapkan, lalu append audit/receipt dan increment versi dalam satu update; replay identik mengembalikan acknowledgement semula. Data batal dikecualikan dari ringkasan valid tetapi tetap tersedia lewat filter dan detail.

## M-02 — foto yang diimplementasikan

`attachments[]` menyimpan id UUID, storageKey acak, originalName bersih, mime hasil image/webp, sizeBytes, kind INITIAL/PROGRESS/COMPLETION, uploadedAt dan uploadedBy snapshot akun. Berkas asli tidak disimpan; decoder memvalidasi JPEG/PNG/WebP dan hasil WebP dibatasi 5 MiB, 4096 px sisi, 40 juta piksel sumber. Folder default development `.local/uploads`; UPLOAD_DIR absolut dapat menunjuk volume privat. Tidak ada URL statik. Metadata/audit/receipt/versi ditulis satu CAS; kegagalan write menghapus file baru. Crash pada celah file dan DB dapat menyisakan orphan; operasi/backup perlu memeriksanya sebelum pilot. Foto tidak wajib, tidak dihapus saat batal, dan tidak ada aksi hapus MVP.
