# Kontrak API MVP

Rancangan REST `/api/v1`, JSON UTF-8. **Implementasi sampai D0-06:** GET `/health`, GET `/ready` internal, POST `/auth/login`, GET `/auth/me`, POST `/auth/logout`, GET `/divisions`, GET `/admin/accounts`, GET `/dashboard` ringkas, GET `/findings`, dan GET `/findings/summary` tersedia. Path pada tabel di bawah berawalan `/api/v1` kecuali health/ready. GET `/findings/:id`, GET `/findings/:id/progress`, GET `/findings/:id/history`, POST `/findings`, PATCH `/findings/:id`, POST `/findings/:id/progress` juga tersedia. Pembatalan/pemulihan M-03 tersedia; foto, ekspor, mutasi admin dan dashboard lengkap masih rencana. Path belum tersedia mengembalikan 401 tanpa login, 403 untuk divisi pada namespace admin, atau 404 setelah pemeriksaan akses lolos. Galat minimal saat ini berisi code, message, requestId; fields ditambahkan saat validasi bisnis diimplementasikan. Aturan produk pada [PRD](PRD.md), field/validasi pada [model data](DATA_MODEL.md). API menerima dan mengembalikan kode status IN_PROGRESS, ON_HOLD, COMPLETED; terjemahan dilakukan UI.

## Konvensi

- Semua endpoint data memerlukan sesi aktif; ADMIN diperiksa server pada `/admin/*`. Tidak ada pembatasan edit berdasarkan divisi pemilik.
- Mutasi memakai cookie sesi, X-CSRF-Token, pemeriksaan Origin, allowlist field, validasi ID/tanggal/referensi.
- Mutasi finding menyertakan `version` terkini dan `mutationId` UUID unik per operasi. Create hanya `mutationId`. Aktor/waktu/audit/version baru dibuat server.
- Berhasil: `{ "data": ... }`; list: `{ "data": [...], "meta": { "page": 1, "pageSize": 20, "total": 35 } }`.
- Gagal: `{ "error": { "code": "...", "message": "...", "fields": {}, "requestId": "..." } }`. Jangan mengembalikan stack trace, hash sandi, session ID atau detail internal database.
- 400 kueri/JSON salah, 401 sesi tidak ada/kedaluwarsa, 403 akses/CSRF ditolak, 404 data tidak ditemukan, 409 konflik/duplikat/kapasitas histori, 413 unggahan terlalu besar, 415 jenis tidak didukung, 422 validasi bisnis, 429 rate limit, 500 gangguan internal.
- Setelah konflik, backend mengembalikan currentVersion; klien memuat ulang tanpa menghilangkan draf dan meminta pengguna meninjau perubahan sebelum simpan ulang.

## Endpoint

| Method/path | Input inti | Hasil/hak |
| --- | --- | --- |
| POST /auth/login | username, password | Sesi baru, identitas akun, csrfToken; validasi Origin dan rate limit; tidak ada registrasi |
| GET /auth/me | Cookie | Akun/divisi/peran dan csrfToken; 401 bila tidak aktif |
| POST /auth/logout | CSRF | Cabut sesi saat ini, 204 |
| GET /divisions | activeOnly default true | Master divisi; pengguna login |
| GET /findings | Filter + pagination | D0-04: daftar ringkas + meta.summary seluruh hasil filter dari aggregate yang sama; tanpa audit/progres/foto biner |
| POST /findings | Data awal + mutationId UUID v4 | D0-05: 201 acknowledgement versi 1/IN_PROGRESS; retry identik 200 tanpa duplikasi |
| GET /findings/:id | ID | D0-05: detail bisnis + 10 progres terbaru, actor snapshot dan attachmentCount; tanpa audit/receipt/storageKey |
| PATCH /findings/:id | Field core yang berubah, version, mutationId | D0-05: 200 acknowledgement; koreksi core + audit/versi atomik. Status melalui progress. |
| GET /findings/:id/progress | page/pageSize | D0-06: catatan progres terbaru dahulu, aktor/waktu/revisi; metadata halaman |
| GET /findings/:id/history | page/pageSize | D0-06: audit terbaru dahulu, before/after, aktor snapshot, alasan koreksi, snapshot nama divisi dan tautan catatan |
| POST /findings/:id/progress | text opsional, status/targetDate/priority opsional, holdReason/correctionReason bila perlu, version, mutationId | D0-05: acknowledgement; minimal satu perubahan/catatan, progres+audit+receipt+versi dalam satu write |
| POST /findings/:id/cancel | reason, version, mutationId | Tandai batal; 422 tanpa alasan |
| POST /findings/:id/restore | reason, version, mutationId | ADMIN saja; pulihkan batal, audit |
| POST /findings/:id/attachments | Multipart file, kind, version, mutationId | 201 metadata; tidak menerima storageKey dari klien |
| GET /findings/:id/attachments/:attachmentId | ID | File yang direferensikan temuan, setelah login; private/no-store |
| GET /findings/summary | Filter tanpa pagination | totalMatched, totalValid, counts per status, open, overdue, cancelled; satu aggregate untuk counts |
| GET /dashboard | responsibleDivisionIds, month | D0-03: snapshot/status + indikator bulan. Tren 6 bulan, per-divisi dan 5 tindak lanjut masih M-04. |
| GET /exports/findings.pdf | Filter list tanpa page/pageSize | application/pdf, attachment, private/no-store; semua hasil filter, batas eksplisit |
| GET /admin/accounts | pagination | ADMIN; tanpa passwordHash |
| POST /admin/accounts | username, displayName, divisionId, role, initialPassword | ADMIN; 201; audit akun |
| PATCH /admin/accounts/:id | active/displayName, version, mutationId | ADMIN; tidak boleh menonaktifkan admin terakhir/dirinya secara tidak sengaja |
| POST /admin/accounts/:id/reset-password | newPassword, version, mutationId | ADMIN; sessionVersion naik, audit, jangan log password |
| POST /admin/divisions | code, name | ADMIN; unik, aktif |
| PATCH /admin/divisions/:id | name/active, version, mutationId | ADMIN; tidak hard delete; nama lama dipertahankan pada audit |
| GET /health | Tidak ada | Publik hanya status proses; tanpa konfigurasi internal |
| GET /ready | Tidak ada | Internal/proxy ops saja, koneksi DB; bukan endpoint data publik |

Daftarkan route statis `/findings/summary` sebelum `/:id` untuk menghindari tertangkap sebagai ID. Tidak ada DELETE finding/audit, approve, reject, register publik, atau reopen kejadian lama.

## Rincian autentikasi D0-02

- Login menerima hanya `{ username, password }`; username dinormalisasi trim/lowercase, format 3–64 karakter `a-z0-9._-`; sandi string 1–128 karakter. Seed membuat sandi acak 24 karakter; batas login bukan aturan pembuatan sandi admin M-06.
- Login/me: `{ data: { account: { id, username, displayName, role, active, division: { id, code, name } | null }, csrfToken, expiresAt } }`. Tidak mengirim hash sandi, sessionVersion, atau token cookie dalam JSON.
- Cookie lokal `she_session_dev`; demo HTTPS `__Host-she_session`, host-only, HttpOnly, Path=/, SameSite=Lax, Secure saat demo. Masa absolut 12 jam, tanpa sliding renewal. Login ulang dengan cookie lama mencabut sesi lama; perangkat lain tetap aktif.
- Logout mewajibkan Origin allowlist dan `X-CSRF-Token` sesi tersebut, menghapus sesi dan cookie lalu 204. Semua mutasi setelah login melalui guard yang sama. Login memerlukan Origin allowlist, tanpa CSRF pra-login.
- Batas login fixed window 15 menit: 10 percobaan/username dan 30/IP (termasuk sukses/input tidak valid); 429 `LOGIN_RATE_LIMITED` + `Retry-After`. Counter MongoDB tetap berlaku setelah API restart; batas dapat mencapai dua kali kuota di sekitar pergantian window. Tidak mempercayai X-Forwarded-For; proxy hosting belum dikonfigurasi.
- GET divisions hanya menerima `activeOnly=true|false`; default true. GET admin/accounts hanya `page`/`pageSize` (default 1/20, maksimal 100), tanpa rahasia. Query lain 400.
- Akun nonaktif/sessionVersion tidak cocok/expired selalu 401 meskipun TTL belum membersihkan record. Endpoint reset/nonaktif/ubah peran beserta auditnya masih M-06.

## Dashboard ringkas D0-03

Endpoint GET `/api/v1/dashboard` memerlukan sesi aktif divisi atau admin, tanpa pembatasan data berdasarkan divisi akun. Filter `responsibleDivisionIds` adalah OR penanggung jawab, maksimal 50 ID ObjectId heksadesimal dipisah koma; duplikat dihapus, tanpa parameter berarti semua divisi. ID valid yang tidak ditemukan memberi hasil nol. String kosong, array/parameter berulang, format ID salah dan query di luar allowlist ditolak 400 INVALID_QUERY. `month` memakai YYYY-MM (tahun 1000–9999), default bulan kalender server pada APP_TIMEZONE; bulan mendatang sah dan dapat nol.

Respons saat ini (contoh struktur, angka bukan konstanta):

```json
{
  "data": {
    "dataMode": "DEMO",
    "asOf": "2026-11-09T10:00:00.000Z",
    "today": "2026-11-09",
    "timeZone": "Asia/Jakarta",
    "scope": { "responsibleDivisionIds": [] },
    "snapshot": {
      "totalValid": 16,
      "counts": { "IN_PROGRESS": 6, "ON_HOLD": 5, "COMPLETED": 5 },
      "open": 11, "overdue": 5
    },
    "period": { "month": "2026-11", "reported": 9, "completed": 5 }
  }
}
```

Semua angka memakai satu aggregate MongoDB: data batal dikecualikan, tanpa unwind penanggung jawab agar temuan bersama tetap unik. Snapshot semua tanggal; `month` hanya memengaruhi period.reported (reportedDate) dan period.completed (status kini COMPLETED + completedAt pada zona aplikasi). Target kosong/hari ini dan status Selesai tidak terlambat. Respons tidak mengirim pelapor, uraian, audit atau dokumen akun. Database kosong memberi nol; kegagalan pembacaan memberi 500 tanpa data/angka nol palsu. `asOf` adalah waktu request, bukan jaminan snapshot historis resmi.

## Filter bersama

| Parameter | Arti |
| --- | --- |
| responsibleDivisionIds | String ID dipisah koma; OR antar divisi; jangan $unwind lalu menggandakan jumlah |
| reporterDivisionId | Satu divisi asal pelapor |
| status | Salah satu enum status; tidak ada NEW |
| priority | LOW/MEDIUM/HIGH/UNASSESSED |
| q | Teks maksimal 100; cari referensi, uraian, lokasi/nama pelapor; regex input harus di-escape |
| from, to | YYYY-MM-DD inklusif, from ≤ to |
| dateBasis | reported (default) atau completed; completed hanya yang status kini COMPLETED dengan completedAt terisi |
| cancellation | active (default), cancelled, all |
| page, pageSize | Awal 1; default 20, maksimal 100; tidak berlaku untuk summary/PDF |
| sort | reportedDate:asc, reportedDate:desc, updatedAt:asc, updatedAt:desc; default reportedDate:desc, _id sebagai tie-breaker arah sama |

List, summary, dan PDF memakai parser/filter builder yang sama. Filter unknown ditolak, bukan disisipkan langsung ke MongoDB. PDF dan ringkasan tidak mengikutkan page/pageSize. Setiap respons memberikan asOf server. Respons bisa berubah bila ada edit di antara request; UI refresh list+summary setelah mutasi dan saat kembali ke daftar, tampilkan timestamp, jangan menjanjikan live snapshot.

Dashboard berbeda dari filter tanggal daftar: division scope berlaku untuk seluruh dashboard; month hanya angka periodik/tren. Kartu status adalah snapshot semua tanggal. Definisi pada [UI](UI_SPEC.md).

## Daftar dan ringkasan D0-04

GET `/findings` dan `/findings/summary` terproteksi sesi divisi/admin; baca lintas divisi tetap diperbolehkan. Keduanya memakai parser/filter builder yang sama. Query di luar allowlist, operator Mongo, parameter berulang/array, enum salah, tanggal kalender tidak valid (termasuk kabisat), from > to, page di luar 1–999999, dan pageSize di luar 1–100 ditolak 400 INVALID_QUERY. Tahun kalender 1000–9999, penanggung jawab maksimal 50 ID unik (input maksimal 50), q trim maksimal 100 karakter; regex di-escape agar pencarian literal, case-insensitive. Parameter status/priority/ID/tanggal kosong tidak sah; q kosong sah tanpa pencarian.

`dateBasis=completed` selalu membatasi status kini COMPLETED dengan completedAt terisi Date, walau from/to kosong. Batas from/to inklusif menggunakan tanggal kalender pada zona aplikasi. Bila status bertentangan, hasil nol; server tidak mengganti filter status diam-diam. ID divisi valid yang tidak ditemukan juga hasil nol. Master divisi nonaktif tetap dapat difilter dan tampil pada data historis.

Respons list: `{ data: [row], meta: { page, pageSize, total, totalPages, summary, asOf, today, timeZone, dataMode } }`. total adalah totalMatched sebelum pagination; totalPages=ceil(total/pageSize), nol jika kosong. Halaman melampaui hasil memberi 200 dengan data=[], total/summary tetap sesuai filter (UI menyediakan kembali ke halaman pertama). Row hanya berisi id, reference, reportedDate, descriptionExcerpt (maks. 240), descriptionTruncated, location, reporterName, reporterDivision/responsibleDivisions (id/code/name/active), status/priority/targetDate/cancelledAt, updatedAt, updatedBy (username/displayName/source saja), ageDays/isNew/isOverdue. Tidak mengirim dokumen raw, full description panjang, audit, progres, storageKey atau secret akun.

`summary={totalMatched,totalValid,counts:{IN_PROGRESS,ON_HOLD,COMPLETED},open,overdue,cancelled}`. Pada cancellation=all/cancelled, totalMatched mencakup batal; kartu counts/totalValid/open/overdue hanya tidak batal, cancelled ditampilkan terpisah. Default active mengecualikan batal. isNew memakai selisih tanggal laporan 0–6; isOverdue memakai target < today, status aktif dan tidak batal.

List memakai `$match` + proyeksi allowlist + `$facet`: rows diurutkan/dipaginasi, summary dihitung dari seluruh input facet yang sama. UI memakai meta.summary, sehingga tidak perlu dua request yang berpotensi berbeda. GET `/findings/summary` memakai aggregate counts dan mengembalikan `{data:{...summary,asOf,today,timeZone,dataMode}}`, menolak page/pageSize; sort diterima tetapi tidak memengaruhi hitungan. Keduanya maxTimeMS 5 detik; galat pembacaan 500 tanpa angka palsu. Nama master divisi dibaca terpisah setelah aggregate; asOf adalah waktu request, bukan jaminan histori snapshot resmi.

Parser/builder tersedia untuk dipakai ekspor PDF nanti; endpoint PDF belum diimplementasikan. Route statis summary sudah didaftarkan sebelum calon detail. Detail dan mutasi inti tersedia pada D0-05; pembatalan M-03 tersedia; foto/PDF belum tersedia.

## Mutasi dan detail D0-05

Semua mutasi melalui sesi aktif, Origin allowlist dan token CSRF. Identitas/waktu/versi baru berasal dari server; payload tidak boleh menentukan actor, status awal, completedAt, audit/receipt atau field internal. Data awal memakai field core sesuai DATA_MODEL; prioritas/target boleh null/tidak diisi, tanpa unggahan wajib, status awal IN_PROGRESS. Tanggal laporan tidak melewati hari kalender server, target tidak sebelum laporan, penanggung jawab 1–50 ID unik, referensi baru hanya divisi aktif. Edit yang tidak mengubah referensi divisi historis nonaktif tetap diterima. Field/tipe/referensi salah 422 VALIDATION_FAILED dengan error.fields; ID path tidak valid juga 422, ID valid tidak ditemukan 404.

PATCH hanya field core (reportedDate, description, location, reporterName, reporterDivisionId, responsibleDivisionIds, priority, targetDate) + version/mutationId. Progress menerima text/status/holdReason/priority/targetDate/correctionReason + version/mutationId. Tertunda wajib alasan 1–2000; pindah keluar Tertunda mengosongkan holdReason, nilai lama tetap audit. Selesai mengisi completedAt server saat transisi; pengeditan catatan pada status Selesai mempertahankan waktu itu. Koreksi COMPLETED ke aktif wajib correctionReason; completedAt dikosongkan, bukan mekanisme kejadian berulang. Tidak ada persentase per divisi atau approval. Tanpa perubahan/catatan 422 NO_CHANGES. Temuan batal tidak dapat dimutasi (409 FINDING_CANCELLED).

**Penyesuaian kontrak teknis:** respons tulis adalah acknowledgement ringkas yang stabil, `{data:{id,reference,version,status,updatedAt},meta:{replayed:false|true}}`; klien melakukan GET detail untuk snapshot terbaru. Ini menggantikan rancangan awal mengembalikan detail penuh pada PATCH, agar retry tetap memberi hasil operasi aslinya tanpa menggandakan data atau mengaku versi sekarang adalah hasil lama. Create pertama 201, retry create 200; PATCH/progress 200. GET detail sendiri mengembalikan field core/ID/nama divisi, actor snapshot, version, status/target/prioritas/alasan/completedAt, pembatalan, waktu/label turunan, 10 progres terbaru/progressTotal dan attachmentCount. Tidak mengirim audit, mutationReceipts/requestHash, biner/storageKey atau hash sandi. GET /progress dan /history dipaginasi pada D0-06.

mutationId hanya UUID v4; request yang sama harus memakai ID dan payload/akun yang sama. Create memakai indeks unik createMutationId (parsial, fixture tanpa ID tetap sah). Update mencari receipt pada dokumen sebelum konflik versi; receipt memuat SHA-256 request canonical (jenis, accountId, body tanpa mutationId) dan acknowledgement awal. Payload/akun/jenis operasi berbeda pada ID yang sama ditolak 409 MUTATION_REUSED. Retry sukses mengembalikan acknowledgement asli walaupun ada versi lebih baru; GET detail memastikan UI membaca keadaan terkini.

Audit before/after, actor akun divisi, snapshot nama/kode divisi, progres append-only, receipt dan increment versi disimpan atomik bersama dalam satu dokumen. Write kondisional _id + version + tidak batal; stale write 409 VERSION_CONFLICT dengan currentVersion, tanpa overwrite. Dua retry serentak operasi sama mengembalikan hasil sama, tidak menambah progres/audit. Batas BSON aplikasi 8 MiB diperiksa sebelum write; 409 HISTORY_CAPACITY_REACHED menghentikan operasi tanpa menghapus riwayat. Receipt tidak dipangkas diam-diam. Pembacaan audit dan peninjauan konflik tersedia pada D0-06.

## Contoh create (semua nilai contoh)

```json
{
  "reportedDate": "2026-11-09",
  "description": "Pintu panel contoh berkarat; perlu tindak lanjut.",
  "location": "Area Demo A",
  "reporterName": "Pelapor Contoh 01",
  "reporterDivisionId": "000000000000000000000001",
  "responsibleDivisionIds": ["000000000000000000000002", "000000000000000000000003"],
  "targetDate": null,
  "priority": null,
  "mutationId": "ea9e431d-c2be-4f2b-b13a-6ee9d5f884f3"
}
```

Server mengisi status, reference, createdBy, waktu dan audit. Tanggal contoh bukan default permanen. Detail mengembalikan isNew/isOverdue/today/timeZone dari perhitungan server.

## Konsistensi mutasi

Hitung perubahan dan audit berdasarkan versi dokumen yang dibaca. Write kondisional `_id+version` mengubah field, append audit, dan increment version bersama. Jika version berbeda, 409 VERSION_CONFLICT tanpa menyimpan sebagian. Retry mutationId yang sudah berhasil mengembalikan acknowledgement operasi sebelumnya, bukan menggandakan catatan; klien kemudian GET detail terbaru. Mutasi akun/divisi mengikuti pola version+audit tertanam yang sama. Progres append-only; koreksi dijelaskan melalui catatan baru, tidak mengubah histori diam-diam.

Koreksi COMPLETED menjadi aktif memerlukan correctionReason dan dicatat sebagai koreksi, bukan kejadian berulang. Pembaruan record batal ditolak kecuali pemulihan admin. Unggah memeriksa version setelah file diverifikasi dan membersihkan file orphan bila gagal.

## Batas PDF usulan

Maksimal 1.000 hasil per ekspor dan satu proses PDF aktif per instance backend; jika lebih, 422 EXPORT_TOO_LARGE meminta filter lebih sempit, bukan memotong diam-diam. Jika proses penuh, 429 EXPORT_BUSY. Tidak menyertakan pagination klien. Batas merupakan asumsi teknis; skala awal jauh di bawahnya tetapi tetap diuji.

## D0-06 — riwayat yang dipaginasi

GET `/findings/:id/progress` dan GET `/findings/:id/history` memerlukan sesi aktif, termasuk untuk temuan batal. Query hanya `page` (default 1, maksimum 100000) dan `pageSize` (default 10, maksimum 50); angka bulat positif kanonis, parameter lain/berulang ditolak 422. ID salah 422; tidak ditemukan 404. Urutan terbaru dahulu berdasarkan array append-only, sehingga halaman dapat bergeser bila ada tulis baru saat membaca halaman berikutnya. Respons `{data:[...],meta:{page,pageSize,total,totalPages}}`; halaman kosong setelah akhir memberi 200. Batas array dipotong di MongoDB, bukan mengirim dokumen audit penuh ke klien.

Progres mengirim `id,text,actor,timestamp,revision`. Audit mengirim `id,action,actor,timestamp,revision,before,after,correctionReason,reason,progressEntryId,divisionSnapshots`. Nilai ObjectId dan waktu dalam before/after menjadi string API. `CREATED` memiliki before null; event `DEMO_SEED` lama dapat memiliki id/before/after null dan bukan edit akun. Tidak mengirim mutationId, receipt, requestHash atau field internal lain. Snapshot nama divisi berasal dari waktu mutasi, bukan nama master terkini.

## M-03 — batal dan pulih

POST `/findings/:id/cancel` untuk semua akun login dan POST `/findings/:id/restore` hanya untuk role ADMIN. Keduanya wajib `version`, `mutationId` UUID v4 dan `reason` 1–2000 karakter setelah trim; field lain ditolak. Wajib Origin yang diizinkan, cookie sesi dan CSRF. Respons 200 acknowledgement yang sama dengan mutasi lain; retry identik mengembalikan `meta.replayed=true` tanpa event/versi baru, termasuk setelah transisi berikutnya. `ALREADY_CANCELLED`/`NOT_CANCELLED` 409 untuk transisi salah, `VERSION_CONFLICT` 409 bila stale, `FORBIDDEN` 403 bila divisi mencoba restore. Audit `CANCELLED`/`RESTORED` menyertakan reason, actor, waktu, snapshot divisi dan before/after `cancelledAt`, `cancellationReason`, `cancelledBy`; restore mengosongkan tiga field ini tanpa mengubah status pekerjaan/completedAt. Detail mengirim `cancelledBy`. Data batal tetap terbaca pada detail/riwayat dan filter Batal, tetapi koreksi/progres ditolak sampai admin memulihkan. Tidak ada DELETE.
